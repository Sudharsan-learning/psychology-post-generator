import { NextResponse } from "next/server";
import { OpenRouter } from "@openrouter/sdk";

// ─── Types ───────────────────────────────────────────────
interface CarouselContent {
  s1: { eyebrow: string; headline: string; subtext: string };
  s2: { eyebrow: string; headline: string; subtext: string };
  s3: { eyebrow: string; headline: string; subtext: string };
  s4: { eyebrow: string; headline: string; ctaLabel: string; ctaAction: string };
  caption: string;
  hashtags: string[];
}

// ─── OpenRouter Client ───────────────────────────────────
function getClient() {
  return new OpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
  });
}

// ─── TEXT GENERATION (Carousel + Caption) ────────────────
async function generateCarouselText(content: string): Promise<CarouselContent> {
  const openrouter = getClient();

  const prompt = `You are an expert Instagram content creator specializing in psychology.
Create a 4-slide carousel text package from this topic:

"${content}"

Rules:
- Output ONLY valid JSON, no markdown, no code fences.
- Slide 1 (Cover): eyebrow (2-3 words), headline (catchy, 3-6 words), subtext (1 sentence hook).
- Slide 2 (Observation): eyebrow (2-3 words), headline (3-6 words), subtext (2-3 short lines explaining the pattern).
- Slide 3 (Reframe): eyebrow (2-3 words), headline (3-6 words), subtext (2-3 short lines offering a new perspective).
- Slide 4 (Closing): eyebrow (2-3 words), headline (short takeaway), ctaLabel (e.g. 'Next Step'), ctaAction (e.g. 'Save this post.').
- Caption: 2-3 insightful lines for the actual post description.
- Hashtags: 10 relevant hashtags.

Return exactly this JSON structure:
{
  "s1": {"eyebrow": "...", "headline": "...", "subtext": "..."},
  "s2": {"eyebrow": "...", "headline": "...", "subtext": "..."},
  "s3": {"eyebrow": "...", "headline": "...", "subtext": "..."},
  "s4": {"eyebrow": "...", "headline": "...", "ctaLabel": "...", "ctaAction": "..."},
  "caption": "...",
  "hashtags": ["#one"]
}`;

  const stream = await openrouter.chat.send({
    chatRequest: {
      model: "nvidia/nemotron-3-ultra-550b-a55b:free",
      messages: [{ role: "user", content: prompt }],
      stream: true,
    },
  });

  let fullResponse = "";

  if (Symbol.asyncIterator in Object(stream)) {
    for await (const chunk of stream as AsyncIterable<any>) {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) {
        fullResponse += delta;
      }
    }
  } else {
    // Non-streaming fallback
    const result = stream as any;
    fullResponse = result.choices?.[0]?.message?.content ?? "";
  }

  if (!fullResponse.trim()) {
    throw new Error("LLM returned empty response");
  }

  const cleaned = fullResponse
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  let json: CarouselContent;
  try {
    json = JSON.parse(cleaned);
  } catch {
    console.error("Failed to parse LLM output:", cleaned);
    throw new Error("LLM returned invalid JSON. Try again.");
  }

  return json;
}

// ─── API HANDLER ─────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const content = body?.content;

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json(
        { error: "content is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { error: "Content must be under 1000 characters" },
        { status: 400 }
      );
    }

    const post = await generateCarouselText(content.trim());

    return NextResponse.json({
      success: true,
      post,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    console.error("API Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
