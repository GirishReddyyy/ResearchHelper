const rateCache = new Map<string, { count: number, resetAt: number }>();

/**
 * Basic in-memory rate limiter. 
 * Note: In a true serverless environment, this resets per-lambda cold start. 
 * Since this is for a small group of friends, that's acceptable.
 */
export function checkRateLimit(identifier: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateCache.get(identifier);

  if (!record || record.resetAt < now) {
    rateCache.set(identifier, { count: 1, resetAt: now + windowMs });
    return true; // Allowed
  }

  if (record.count >= limit) {
    return false; // Rate limited
  }

  record.count += 1;
  return true; // Allowed
}

// Clean up old entries periodically to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateCache.entries()) {
    if (value.resetAt < now) {
      rateCache.delete(key);
    }
  }
}, 60000); // Check every minute
