import { db } from "@/lib/db";

/**
 * Ensures a local User record exists for the given Clerk userId.
 * Creates one lazily on first access using a real Clerk email if available,
 * otherwise falls back to a placeholder.
 *
 * Extracted here to eliminate copy-pasted user-creation logic across API routes.
 */
export async function ensureUser(
  userId: string,
  clerkEmail?: string | null
) {
  const existing = await db.user.findUnique({
    where: { clerkId: userId },
  });
  if (existing) return existing;

  return db.user.create({
    data: {
      clerkId: userId,
      // Use the real email if Clerk provides it, else use a scoped placeholder
      email: clerkEmail ?? `${userId}@swipeposts.local`,
    },
  });
}
