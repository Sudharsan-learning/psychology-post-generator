import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { ensureUser } from "@/lib/ensureUser";
import { isRateLimited } from "@/lib/rateLimiter";
import { SavePostSchema, SlideSchema } from "@/lib/schemas";
import { z } from "zod";

type SlideInput = z.infer<typeof SlideSchema>;

// ─── Body size guard (1 MB) ───────────────────────────────────────────────────
const MAX_BODY_BYTES = 1 * 1024 * 1024;

async function readBody(req: Request): Promise<string | null> {
  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
    return null;
  }
  // Stream-limit guard
  const reader = req.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      total += value.byteLength;
      if (total > MAX_BODY_BYTES) return null; // exceeded limit
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

// ─── GET: Load all posts (or a single post by ?id=) ──────────────────────────
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const postId = searchParams.get("id");

    const localUser = await ensureUser(userId);

    if (postId) {
      // Validate postId format to avoid DB noise
      if (!/^[a-z0-9]{20,30}$/i.test(postId)) {
        return NextResponse.json({ error: "Invalid post id" }, { status: 400 });
      }
      const post = await db.post.findFirst({
        where: { id: postId, userId: localUser.id },
      });
      if (!post) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
      }
      return NextResponse.json(post);
    }

    // Cursor-based pagination + search + filters
    const cursor = searchParams.get("cursor") || undefined;
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
    const search = searchParams.get("search") || undefined;
    const platform = searchParams.get("platform") || undefined;
    const template = searchParams.get("template") || undefined;

    const whereClause: any = {
      userId: localUser.id,
    };

    if (search) {
      whereClause.OR = [
        { topic: { contains: search, mode: "insensitive" } },
        { caption: { contains: search, mode: "insensitive" } },
        { hashtags: { contains: search, mode: "insensitive" } },
      ];
    }

    if (platform) {
      whereClause.platform = platform;
    }

    if (template) {
      whereClause.activeTemplate = template;
    }

    const posts = await db.post.findMany({
      where: whereClause,
      orderBy: { updatedAt: "desc" },
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });

    let nextCursor: string | null = null;
    if (posts.length > limit) {
      const nextItem = posts.pop();
      nextCursor = nextItem ? nextItem.id : null;
    }

    return NextResponse.json({
      posts,
      nextCursor,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ─── POST: Create or update a post ───────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit: 30 saves per minute per user
    if (isRateLimited(userId, 30, 60_000)) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
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
    const parsed = SavePostSchema.safeParse(rawJson);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error.", details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const {
      id,
      topic,
      caption,
      hashtags,
      slides,
      activeTemplate,
      platform,
      chatHistory,
    } = parsed.data;

    const localUser = await ensureUser(userId);

    let post;
    if (id) {
      // Verify ownership before update
      const existing = await db.post.findFirst({
        where: { id, userId: localUser.id },
      });
      if (existing) {
        post = await db.post.update({
          where: { id },
          data: {
            topic,
            caption,
            hashtags,
            slides: slides as SlideInput[],
            activeTemplate,
            platform,
            chatHistory: chatHistory ?? undefined,
          },
        });
      }
      // If id provided but not owned by user, fall through and create new
    }

    if (!post) {
      post = await db.post.create({
        data: {
          userId: localUser.id,
          topic,
          caption,
          hashtags,
          slides: slides as SlideInput[],
          activeTemplate,
          platform,
          chatHistory: chatHistory ?? undefined,
        },
      });
    }

    return NextResponse.json({ success: true, post });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ─── DELETE: Delete a post ────────────────────────────────────────────────────
export async function DELETE(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit: 20 deletes per minute per user
    if (isRateLimited(userId, 20, 60_000)) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(req.url);
    const postId = searchParams.get("id");

    if (!postId) {
      return NextResponse.json({ error: "id parameter is required." }, { status: 400 });
    }

    const localUser = await ensureUser(userId);

    const existing = await db.post.findFirst({
      where: { id: postId, userId: localUser.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Post not found or unauthorized." },
        { status: 404 }
      );
    }

    await db.post.delete({ where: { id: postId } });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
