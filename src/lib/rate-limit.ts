// In-memory sliding-window rate limiter for login attempts.
//
// This is process-local: it resets on redeploy and doesn't share state
// across multiple serverless instances. That's an acceptable trade-off to
// blunt casual credential-stuffing during development/small-scale use, but
// it is NOT sufficient for a multi-instance production deployment — swap
// this for a shared store (Upstash Redis, per the architecture doc) before
// relying on it at scale.

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 10;

const attempts = new Map<string, number[]>();

export function checkRateLimit(key: string): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const timestamps = (attempts.get(key) ?? []).filter((t) => now - t < WINDOW_MS);

  if (timestamps.length >= MAX_ATTEMPTS) {
    const retryAfterMs = WINDOW_MS - (now - timestamps[0]);
    return { allowed: false, retryAfterMs };
  }

  timestamps.push(now);
  attempts.set(key, timestamps);
  return { allowed: true };
}

// Periodic cleanup so the map doesn't grow unbounded over a long-lived process.
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of attempts) {
    const fresh = timestamps.filter((t) => now - t < WINDOW_MS);
    if (fresh.length === 0) attempts.delete(key);
    else attempts.set(key, fresh);
  }
}, WINDOW_MS).unref();
