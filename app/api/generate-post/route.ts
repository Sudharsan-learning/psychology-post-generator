import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { OpenRouter } from "@openrouter/sdk";
import { isRateLimited } from "@/lib/rateLimiter";
import { GeneratePostSchema } from "@/lib/schemas";

// ─── OpenRouter Client ───────────────────────────────────────────────────────
function getClient() {
  return new OpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
  });
}

// ─── Body size guard (1 MB) ───────────────────────────────────────────────────
const MAX_BODY_BYTES = 1 * 1024 * 1024;

async function readBody(req: Request): Promise<string | null> {
  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) return null;
  const reader = req.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      total += value.byteLength;
      if (total > MAX_BODY_BYTES) return null;
      chunks.push(value);
    }
  }
  return new TextDecoder().decode(
    chunks.reduce((a, b) => {
      const merged = new Uint8Array(a.length + b.length);
      merged.set(a);
      merged.set(b, a.length);
      return merged;
    }, new Uint8Array())
  );
}

// ─── Request timeout wrapper ─────────────────────────────────────────────────
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Request timed out after ${ms / 1000}s`)), ms)
    ),
  ]);
}

// ─── API HANDLER ─────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    // Auth check
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    // Rate limit: 10 AI generations per minute per user (keyed by userId, not IP)
    if (isRateLimited(userId, 10, 60_000)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment and try again." },
        { status: 429 }
      );
    }

    // Body size limit
    const rawBody = await readBody(req);
    if (rawBody === null) {
      return NextResponse.json(
        { error: "Request body too large (max 1 MB)." },
        { status: 413 }
      );
    }

    let rawJson: unknown;
    try {
      rawJson = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    // Zod validation
    const parsed = GeneratePostSchema.safeParse(rawJson);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error.", details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { messages, currentSlides, caption, hashtags, activeTemplate, platform } =
      parsed.data;

    const openrouter = getClient();
    const templateConstraints = getTemplateConstraints(activeTemplate, platform);

    const systemPrompt = `You are an expert social media post creator and copywriting assistant.
You maintain a conversational chat with the user to help them build, refine, and polish their social media posts.

[LAYOUT & DESIGN CONSTRAINTS FOR THIS GENERATION]
${templateConstraints}

You must output ONLY valid JSON, with NO markdown formatting, NO code block fences, and NO text outside the JSON.

JSON Schema:
{
  "assistant_message": "Your conversational reply to the user (e.g. 'I\\'ve updated the second slide to be more punchy! Let me know if you want any other edits.').",
  "post": {
    "slides": [
      {
        "eyebrow": "2-3 words",
        "headline": "3-6 words",
        "subtext": "supporting details",
        "isCta": false
      },
      ...
      {
        "eyebrow": "CTA eyebrow",
        "headline": "CTA takeaway",
        "subtext": "",
        "isCta": true,
        "ctaText": "Call to action instruction"
      }
    ],
    "caption": "2-3 conversational, high-converting lines explaining the post",
    "hashtags": ["#tag1", "#tag2", ...]
  }
}

Rules for Content Correctness & Conversational Tone:
- Keep the language highly conversational, friendly, engaging, and easy to read. Write as if speaking directly to a friend.
- Ensure the factual correctness of the information while keeping it simple, clean, and accessible.
- If the user asks to modify slides, retain the structure of the other slides and only update the requested fields.
- If the user provides a topic, generate a complete 4-slide carousel package.
- If the user asks to edit slides, return the updated slides list reflecting their edits, along with your response.
`;

    const openRouterMessages = messages.map(
      (msg: { role: string; content: string }, index: number) => {
        if (index === 0) {
          return {
            role: msg.role as "user" | "assistant",
            content: `${systemPrompt}\n\n[CURRENT SLIDE STATE]\n${JSON.stringify(
              { slides: currentSlides, caption, hashtags },
              null,
              2
            )}\n\n[USER REQUEST]\n${msg.content}`,
          };
        }
        return {
          role: msg.role as "user" | "assistant",
          content: msg.content,
        };
      }
    );

    const models = [
      "google/gemma-2-9b-it:free",
      "meta-llama/llama-3.1-8b-instruct:free",
      "openrouter/auto", // Paid fallback
    ];

    let fullResponse = "";
    let lastError: unknown = null;

    for (const model of models) {
      try {
        // Wrap each model call in a 30-second timeout
        const stream = await withTimeout(
          openrouter.chat.send({
            chatRequest: {
              model,
              messages: openRouterMessages,
              stream: true,
              maxTokens: 2048, // Prevent runaway cost / hang
            },
          }),
          30_000
        );

        let currentResponse = "";
        if (Symbol.asyncIterator in Object(stream)) {
          for await (const chunk of stream as AsyncIterable<
            unknown & { choices?: { delta?: { content?: string } }[] }
          >) {
            const delta = chunk.choices?.[0]?.delta?.content;
            if (delta) currentResponse += delta;
          }
        } else {
          const result = stream as unknown as {
            choices?: { message?: { content?: string } }[];
          };
          currentResponse = result.choices?.[0]?.message?.content ?? "";
        }

        if (currentResponse.trim()) {
          fullResponse = currentResponse;
          break; // Success — stop trying more models
        }
      } catch (e: unknown) {
        lastError = e;
        const msg = e instanceof Error ? e.message : String(e);
        console.warn(`Model ${model} failed: ${msg}`);
        // Continue to next model
      }
    }

    if (!fullResponse.trim()) {
      throw new Error(
        `All models failed. Last error: ${
          lastError instanceof Error ? lastError.message : "Unknown error"
        }`
      );
    }

    // Robust JSON extraction: Find the first '{' and matching last '}'
    let cleaned = fullResponse.trim();
    const firstBraceIdx = cleaned.indexOf("{");
    const lastBraceIdx = cleaned.lastIndexOf("}");
    if (firstBraceIdx !== -1 && lastBraceIdx !== -1 && lastBraceIdx > firstBraceIdx) {
      cleaned = cleaned.substring(firstBraceIdx, lastBraceIdx + 1);
    }

    let json: { assistant_message?: string; post?: unknown };
    try {
      json = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse LLM output:", fullResponse);
      throw new Error("LLM returned invalid JSON structure. Try again.");
    }

    return NextResponse.json({
      success: true,
      assistant_message: json.assistant_message,
      post: json.post,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("API Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── Template + platform constraints for the system prompt ──────────────────
function getTemplateConstraints(template: string, platform: string): string {
  let text = `Active Social Platform: ${platform || "instagram"}\n`;
  text += `Active Template Style: ${template || "clinical"}\n\n`;

  if (platform === "linkedin") {
    text += `- Sizing context: LinkedIn Document carousel. Landscape 4:3 or square. Keep text highly professional, authoritative, and clean.\n`;
  } else if (platform === "facebook") {
    text += `- Sizing context: Facebook Landscape post (1.91:1). Height is very limited — keep headlines short and subtexts to 1 short sentence.\n`;
  } else if (platform === "whatsapp") {
    text += `- Sizing context: WhatsApp Status/Story (9:16 portrait). Vertical space is abundant. Keep text engaging, direct, and conversational.\n`;
  } else {
    text += `- Sizing context: Instagram Portrait post (4:5 vertical). Default layout.\n`;
  }

  switch (template) {
    case "bold":
      text += `- Design constraint: "Bold Statement" uses large high-contrast typography. Headlines MUST be 1-4 words max. Keep subtexts empty or highly compact (1 sentence max).\n`;
      break;
    case "clinical":
      text += `- Design constraint: "Clinical Notes" has structured margins. Great for structured lists, concise observations, and clean clinical insights.\n`;
      break;
    case "soft":
      text += `- Design constraint: "Soft Pastel" uses Playfair serif quotes. Perfect for wellness, warm tone reflections, and gentle self-care takeaways.\n`;
      break;
    case "data":
      text += `- Design constraint: "Data Visual" uses Roboto Mono tech elements. Highly structured, data-centric, facts or monospace layout.\n`;
      break;
    case "honey":
      text += `- Design constraint: "Honey Story" uses warm forest & honey tones with elegant Cormorant Garamond serif typography. Write warm, elegant, and narrative-driven copy.\n`;
      break;
    case "mango":
      text += `- Design constraint: "Mango Story" uses bold mango gold & deep forest palette. Perfect for product storytelling, punchy lines, and vibrant energy.\n`;
      break;
    case "developer":
      text += `- Design constraint: "Developer Tips" uses a code editor and terminal aesthetic. You MUST generate realistic code snippets, variables, and commands. Headlines MUST be formatted as variables, commands, or functions (e.g. \`git commit\`, \`const fix = 1;\`). Subtexts MUST be formatted as code comments (e.g., prefix with \`// \` or \`/* \`).\n`;
      break;
    case "terminal":
      text += `- Design constraint: "Terminal (Text)" uses the same terminal aesthetic but is for PLAIN TEXT content. DO NOT format text as code. DO NOT use \`//\`, \`/*\`, \`const\`, or function syntax. Write normal, highly readable headlines and subtexts.\n`;
      break;
  }

  return text;
}
