import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

// GET: Load all posts for the authenticated user, or a single post by ID
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const postId = searchParams.get("id");

    // First ensure the user exists in our local database mapping
    let localUser = await db.user.findUnique({
      where: { clerkId: userId },
    });

    if (!localUser) {
      // Create user lazily on first access
      localUser = await db.user.create({
        data: {
          clerkId: userId,
          email: `${userId}@clerk-user.local`, // Fallback, clerk user details can be fetched if needed
        },
      });
    }

    if (postId) {
      const post = await db.post.findFirst({
        where: {
          id: postId,
          userId: localUser.id,
        },
      });
      if (!post) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
      }
      return NextResponse.json(post);
    }

    const posts = await db.post.findMany({
      where: { userId: localUser.id },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(posts);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST: Create a new post or save an existing one
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid or empty JSON body" }, { status: 400 });
    }

    const { id, topic, caption, hashtags, slides, activeTemplate, platform, chatHistory } = body;

    if (!slides || !Array.isArray(slides)) {
      return NextResponse.json({ error: "slides array is required" }, { status: 400 });
    }

    // Ensure local user exists
    let localUser = await db.user.findUnique({
      where: { clerkId: userId },
    });

    if (!localUser) {
      localUser = await db.user.create({
        data: {
          clerkId: userId,
          email: `${userId}@clerk-user.local`,
        },
      });
    }

    let post;
    if (id) {
      // Check if post exists and belongs to user
      const existing = await db.post.findFirst({
        where: { id, userId: localUser.id },
      });

      if (existing) {
        // Update
        post = await db.post.update({
          where: { id },
          data: {
            topic: topic || "",
            caption: caption || "",
            hashtags: hashtags || "",
            slides: slides as any,
            activeTemplate: activeTemplate || "clinical",
            platform: platform || "instagram",
            chatHistory: chatHistory || null,
          },
        });
      }
    }

    if (!post) {
      // Create new
      post = await db.post.create({
        data: {
          id: id || undefined,
          userId: localUser.id,
          topic: topic || "",
          caption: caption || "",
          hashtags: hashtags || "",
          slides: slides as any,
          activeTemplate: activeTemplate || "clinical",
          platform: platform || "instagram",
          chatHistory: chatHistory || null,
        },
      });
    }

    return NextResponse.json({ success: true, post });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE: Delete a post
export async function DELETE(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const postId = searchParams.get("id");

    if (!postId) {
      return NextResponse.json({ error: "id parameter is required" }, { status: 400 });
    }

    const localUser = await db.user.findUnique({
      where: { clerkId: userId },
    });

    if (!localUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const existing = await db.post.findFirst({
      where: { id: postId, userId: localUser.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Post not found or unauthorized" }, { status: 404 });
    }

    await db.post.delete({
      where: { id: postId },
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
