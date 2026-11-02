import process from 'node:process';
import { Redis } from '@upstash/redis';

let client: Redis | null | undefined;

/**
 * Shared Upstash Redis client, or `null` when it isn't configured (local dev),
 * in which case callers fall back to per-instance memory. Configure it with
 * `NUXT_REDIS_URL` / `NUXT_REDIS_TOKEN`, or the `UPSTASH_REDIS_REST_*` names
 * from the Upstash docs.
 */
export function useRedis() {
  if (client !== undefined)
    return client;

  const { redis } = useRuntimeConfig();
  const url = redis.url || process.env.UPSTASH_REDIS_REST_URL;
  const token = redis.token || process.env.UPSTASH_REDIS_REST_TOKEN;
  client = url && token
    ? new Redis({ url, token })
    : null;
  return client;
}

/** Upstash deserializes JSON automatically, so a stored value may come back as a string or an object. */
export function parseStored<T>(value: unknown): T | null {
  if (value === null || value === undefined)
    return null;
  if (typeof value !== 'string')
    return value as T;
  try {
    return JSON.parse(value) as T;
  }
  catch {
    return null;
  }
}
