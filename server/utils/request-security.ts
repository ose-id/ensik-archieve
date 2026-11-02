import type { H3Event } from 'h3';
import { createHash } from 'node:crypto';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export function assertSameOrigin(event: H3Event) {
  const fetchSite = getRequestHeader(event, 'sec-fetch-site');
  if (fetchSite === 'cross-site') {
    throw createError({ statusCode: 403, statusMessage: 'Cross-site request rejected.' });
  }

  const origin = getRequestHeader(event, 'origin');
  if (!origin) {
    if (!import.meta.dev) {
      throw createError({ statusCode: 403, statusMessage: 'Request origin is required.' });
    }
    return;
  }

  let originHost: string;
  try {
    originHost = new URL(origin).host;
  }
  catch {
    throw createError({ statusCode: 403, statusMessage: 'Invalid request origin.' });
  }

  const requestHost = getRequestHost(event, { xForwardedHost: true });
  if (originHost !== requestHost) {
    throw createError({ statusCode: 403, statusMessage: 'Request origin is not allowed.' });
  }
}

/** Fixed-window counter in Redis, shared by every serverless instance. */
async function countInRedis(key: string, windowMs: number): Promise<RateLimitEntry | null> {
  const redis = useRedis();
  if (!redis)
    return null;

  try {
    // MULTI runs atomically: start the window if it doesn't exist, then count.
    const [, count, ttl] = await redis.multi()
      .set(key, 0, { nx: true, px: windowMs })
      .incr(key)
      .pttl(key)
      .exec<[unknown, number, number]>();
    return { count, resetAt: Date.now() + Math.max(ttl, 0) };
  }
  catch (error) {
    console.warn('[rate-limit] Redis unavailable, using memory.', error);
    return null;
  }
}

/** Per-instance fallback used when Redis isn't configured or is unreachable. */
function countInMemory(key: string, windowMs: number): RateLimitEntry {
  const now = Date.now();
  const current = rateLimitStore.get(key);
  const entry = !current || current.resetAt <= now
    ? { count: 0, resetAt: now + windowMs }
    : current;
  entry.count += 1;
  rateLimitStore.set(key, entry);

  if (rateLimitStore.size > 5_000) {
    for (const [storedKey, value] of rateLimitStore) {
      if (value.resetAt <= now)
        rateLimitStore.delete(storedKey);
    }
  }
  return entry;
}

export async function assertRateLimit(
  event: H3Event,
  scope: string,
  limit: number,
  windowMs: number,
) {
  const clientAddress = getRequestIP(event, { xForwardedFor: true }) || 'unknown';
  const key = `ensik:rate:${createHash('sha256')
    .update(`${scope}:${clientAddress}`)
    .digest('hex')}`;

  const entry = await countInRedis(key, windowMs) ?? countInMemory(key, windowMs);

  const remaining = Math.max(0, limit - entry.count);
  setResponseHeader(event, 'X-RateLimit-Limit', String(limit));
  setResponseHeader(event, 'X-RateLimit-Remaining', String(remaining));
  setResponseHeader(event, 'X-RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));

  if (entry.count > limit) {
    setResponseHeader(event, 'Retry-After', Math.ceil((entry.resetAt - Date.now()) / 1000));
    throw createError({
      statusCode: 429,
      statusMessage: 'Too many requests. Please try again later.',
    });
  }
}
