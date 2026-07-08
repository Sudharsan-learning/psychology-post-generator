import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { OpenRouter } from "@openrouter/sdk";

// ─── OpenRouter Client ───────────────────────────────────
function getClient() {
  return new OpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
  });
}

// ─── Simple rate limiting (in-memory, per-deployment) ────
const requestLog = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 10; // max 10 requests per minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = requestLog.get(ip) ?? [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  requestLog.set(ip, recent);
  return recent.length > RATE_LIMIT_MAX;
}

// ─── API HANDLER ─────────────────────────────────────────
export async function POST(req: Request) {
  try {
    // Auth check — verify Clerk user is signed in
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    // Rate limiting
    const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment and try again." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { messages, currentSlides, caption, hashtags, activeTemplate, platform } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "messages array is required" },
        { status: 400 }
      );
    }

    // Validate messages structure
    for (const msg of messages) {
      if (!msg.role || !msg.content || typeof msg.content !== "string") {
        return NextResponse.json(
          { error: "Each message must have a 'role' and 'content' string." },
          { status: 400 }
        );
      }
      if (msg.role !== "user" && msg.role !== "assistant") {
        return NextResponse.json(
          { error: "Message role must be 'user' or 'assistant'." },
          { status: 400 }
        );
      }
    }

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

    const openRouterMessages = messages.map((msg: { role: string; content: string }, index: number) => {
      if (index === 0) {
        return {
          role: msg.role as "user" | "assistant",
          content: `${systemPrompt}\n\n[CURRENT SLIDE STATE]\n${JSON.stringify({ slides: currentSlides, caption, hashtags }, null, 2)}\n\n[USER REQUEST]\n${msg.content}`
        };
      }
      return {
        role: msg.role as "user" | "assistant",
        content: msg.content
      };
    });

    const models = [
      "google/gemma-2-9b-it:free",
      "meta-llama/llama-3.1-8b-instruct:free",
      "openrouter/auto" // Paid fallback if free fails completely
    ];

    let fullResponse = "";
    let lastError = null;

    for (const model of models) {
      try {
        console.log(`Trying model: ${model}`);
        const stream = await openrouter.chat.send({
          chatRequest: {
            model: model,
            messages: openRouterMessages,
            stream: true,
          },
        });

        let currentResponse = "";
        if (Symbol.asyncIterator in Object(stream)) {
          for await (const chunk of stream as AsyncIterable<
            unknown & { choices?: { delta?: { content?: string } }[] }
          >) {
            const delta = chunk.choices?.[0]?.delta?.content;
            if (delta) {
              currentResponse += delta;
            }
          }
        } else {
          const result = stream as unknown as {
            choices?: { message?: { content?: string } }[];
          };
          currentResponse = result.choices?.[0]?.message?.content ?? "";
        }

        if (currentResponse.trim()) {
          fullResponse = currentResponse;
          break; // Success, exit loop
        }
      } catch (e: unknown) {
        lastError = e;
        console.warn(`Model ${model} failed:`, e instanceof Error ? e.message : e);
        // Continue to next model
      }
    }

    if (!fullResponse.trim()) {
      throw new Error(`All models failed. Last error: ${lastError instanceof Error ? lastError.message : "Unknown error"}`);
    }

    // Robust JSON extraction: Find the first '{' and matching last '}'
    let cleaned = fullResponse.trim();
    const firstBraceIdx = cleaned.indexOf("{");
    const lastBraceIdx = cleaned.lastIndexOf("}");

    if (firstBraceIdx !== -1 && lastBraceIdx !== -1 && lastBraceIdx > firstBraceIdx) {
      cleaned = cleaned.substring(firstBraceIdx, lastBraceIdx + 1);
    }

    let json;
    try {
      json = JSON.parse(cleaned);
    } catch (parseErr) {
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

function getTemplateConstraints(template: string, platform: string): string {
  let text = `Active Social Platform: ${platform || "instagram"}\n`;
  text += `Active Template Style: ${template || "clinical"}\n\n`;

  // Platform specific constraints
  if (platform === "linkedin") {
    text += `- Sizing context: The user is creating a LinkedIn Document carousel. Sizing is landscape 4:3 or square. Keep the text highly professional, authoritative, and clean.\n`;
  } else if (platform === "facebook") {
    text += `- Sizing context: The user is creating a Facebook Landscape post. Height is very limited (1.91:1 aspect ratio). Keep headlines short and restrict subtexts to 1 short sentence to prevent vertical text overflow!\n`;
  } else if (platform === "whatsapp") {
    text += `- Sizing context: The user is creating a WhatsApp Status/Story. Vertical space is abundant (9:16 portrait), but keep design clean. Feel free to use engaging, direct, and conversational text suited for instant story status viewers.\n`;
  } else {
    text += `- Sizing context: The user is creating an Instagram Portrait post (4:5 vertical). This is the default layout.\n`;
  }

  // Template specific constraints
  if (template === "bold") {
    text += `- Design constraint: "Bold Statement" uses extremely large high-contrast typography. Slide headlines MUST be extremely short (1-4 words max) and punchy. Keep subtexts empty or highly compact (1 sentence max).\n`;
  } else if (template === "clinical") {
    text += `- Design constraint: "Clinical Notes" has structured margins. Great for structured lists, concise observations, and clean, clinical insights.\n`;
  } else if (template === "soft") {
    text += `- Design constraint: "Soft Pastel" uses playfair serif quotes. Perfect for wellness, quotes, warm tone reflections, and gentle self-care takeaways.\n`;
  } else if (template === "data") {
    text += `- Design constraint: "Data Visual" has roboto mono tech elements. Highly structured, data-centric, facts or monospace layout style.\n`;
  }

  return text;
}

