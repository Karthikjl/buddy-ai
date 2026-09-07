// In-memory sliding window rate limiter with auto-cleanup and lockout reset controls

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup stale records periodically
setInterval(() => {
  const now = Date.now();
  rateLimitStore.forEach((record, key) => {
    if (now > record.resetAt) {
      rateLimitStore.delete(key);
    }
  });
}, 60 * 1000);

/**
 * Check and consume a rate limit token
 * @param key Unique key (e.g. IP address, username, or email)
 * @param limit Max allowed attempts in the window
 * @param windowMs Window duration in milliseconds
 * @returns { allowed: boolean, remaining: number, resetInSeconds: number, count: number }
 */
export function checkRateLimit(key: string, limit: number = 5, windowMs: number = 5 * 60 * 1000) {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetInSeconds: Math.ceil(windowMs / 1000), count: 1 };
  }

  if (record.count >= limit) {
    const resetInSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
    return { allowed: false, remaining: 0, resetInSeconds, count: record.count };
  }

  record.count += 1;
  const resetInSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
  return { allowed: true, remaining: limit - record.count, resetInSeconds, count: record.count };
}

/**
 * Reset rate limit for a specific key upon successful login or admin manual unlock
 */
export function resetRateLimit(key: string) {
  rateLimitStore.delete(key);
}

/**
 * Reset lockout for a user by email, username, or ID
 */
export function resetUserLockout(identifiers: string[]) {
  for (const id of identifiers) {
    if (!id) continue;
    const clean = id.toLowerCase().trim();
    rateLimitStore.delete(`login:${clean}`);
    rateLimitStore.delete(clean);
  }
}

/**
 * Reset all active lockouts across the system
 */
export function resetAllLockouts() {
  rateLimitStore.clear();
}
