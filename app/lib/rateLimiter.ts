/**
 * Server-side rate limiter using a Map with automatic TTL cleanup.
 *
 * Key design decisions:
 *  - Keyed by Clerk userId (not IP) to prevent spoofing via x-forwarded-for
 *  - TTL cleanup runs on every check to prevent unbounded memory growth
 *  - Configurable window and max-requests
 */

interface RateLimitEntry {
  timestamps: number[];
  lastCleanup: number;
}

const store = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // prune entries older than 5 min

/** Remove all entries whose entire window has expired to prevent memory leak */
function pruneExpired(windowMs: number): void {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now - entry.lastCleanup > CLEANUP_INTERVAL_MS) {
      const fresh = entry.timestamps.filter((t) => now - t < windowMs);
      if (fresh.length === 0) {
        store.delete(key);
      } else {
        store.set(key, { timestamps: fresh, lastCleanup: now });
      }
    }
  }
}

/**
 * Returns true if the given key is over the rate limit.
 *
 * @param key        - Clerk userId or other stable identifier
 * @param maxReqs    - Max requests allowed within windowMs
 * @param windowMs   - Sliding window in milliseconds (default 60s)
 */
export function isRateLimited(
  key: string,
  maxReqs: number = 10,
  windowMs: number = 60_000
): boolean {
  const now = Date.now();

  // Run periodic cleanup to prevent memory leak
  pruneExpired(windowMs);

  const entry = store.get(key) ?? { timestamps: [], lastCleanup: now };
  const recent = entry.timestamps.filter((t) => now - t < windowMs);
  recent.push(now);
  store.set(key, { timestamps: recent, lastCleanup: entry.lastCleanup });

  return recent.length > maxReqs;
}
