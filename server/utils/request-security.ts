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

export function assertRateLimit(
  event: H3Event,
  scope: string,
  limit: number,
  windowMs: number,
) {
  const now = Date.now();
  const clientAddress = getRequestIP(event, { xForwardedFor: true }) || 'unknown';
  const identifier = createHash('sha256')
    .update(`${scope}:${clientAddress}`)
    .digest('hex');

  const current = rateLimitStore.get(identifier);
  const entry = !current || current.resetAt <= now
    ? { count: 0, resetAt: now + windowMs }
    : current;

  entry.count += 1;
  rateLimitStore.set(identifier, entry);

  const remaining = Math.max(0, limit - entry.count);
  setResponseHeader(event, 'X-RateLimit-Limit', String(limit));
  setResponseHeader(event, 'X-RateLimit-Remaining', String(remaining));
  setResponseHeader(event, 'X-RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));

  if (entry.count > limit) {
    setResponseHeader(event, 'Retry-After', Math.ceil((entry.resetAt - now) / 1000));
    throw createError({
      statusCode: 429,
      statusMessage: 'Too many requests. Please try again later.',
    });
  }

  if (rateLimitStore.size > 5_000) {
    for (const [key, value] of rateLimitStore) {
      if (value.resetAt <= now)
        rateLimitStore.delete(key);
    }
  }
}
