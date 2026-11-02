/**
 * Moves legacy uploads (`<username>-img-….jpg` at the store root) into their
 * owner's `users/<discordId>/` folder, so ownership no longer depends on a
 * Discord username that can change hands.
 *
 * Usernames can't be resolved to Discord IDs automatically, so an admin supplies
 * the mapping as JSON: `{ "legacy_username": "123456789012345678" }`.
 *
 *   bun scripts/migrate-legacy-owners.ts --map owners.json           # dry run
 *   bun scripts/migrate-legacy-owners.ts --map owners.json --apply   # migrate
 *
 * Needs BLOB_READ_WRITE_TOKEN. With NUXT_REDIS_URL / NUXT_REDIS_TOKEN (or the
 * UPSTASH_REDIS_REST_* names) it also clears the shared archive index so the
 * app rebuilds it right away.
 */
import { Buffer } from 'node:buffer';
import { createHash, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import process from 'node:process';
import sharp from 'sharp';

interface StoredBlob {
  pathname: string;
  uploadedAt: Date;
}

/** The subset of `@vercel/blob` this script uses, so tests can pass an in-memory store. */
export interface BlobApi {
  del: (pathname: string) => Promise<unknown>;
  get: (pathname: string, options: { access: 'private' | 'public' }) => Promise<{ statusCode: number; stream: ReadableStream<Uint8Array> | null } | null>;
  list: (options: { cursor?: string; limit?: number; prefix?: string }) => Promise<{ blobs: StoredBlob[]; cursor?: string; hasMore: boolean }>;
  put: (pathname: string, data: Buffer, options: Record<string, unknown>) => Promise<unknown>;
}

export interface MigrationItem {
  discordId: string;
  source: StoredBlob;
}

// Keep in sync with server/utils/archive-variant.ts and server/utils/archive-image.ts.
const VARIANT_PREFIX = 'variants/';
const INDEX_KEY = 'ensik:archive-index:v1';
const SNOWFLAKE = /^\d{17,20}$/;
const CONTENT_TYPES: Record<string, string> = { jpeg: 'image/jpeg', jpg: 'image/jpeg', png: 'image/png' };

/** Legacy files live at the store root; app uploads and cached variants live in folders. */
export function isLegacyPathname(pathname: string) {
  return !pathname.includes('/');
}

/** Matches each legacy file to an owner. The longest username wins, so `ab` never claims `ab_c-…`. */
export function planLegacyMigration(blobs: StoredBlob[], owners: Record<string, string>) {
  const prefixes = Object.entries(owners)
    .map(([username, discordId]) => ({ discordId, prefix: `${username.replace(/\s+/g, '_')}-` }))
    .sort((left, right) => right.prefix.length - left.prefix.length);

  const matched: MigrationItem[] = [];
  const unmatched: StoredBlob[] = [];
  for (const blob of blobs.filter(item => isLegacyPathname(item.pathname))) {
    const owner = prefixes.find(item => blob.pathname.startsWith(item.prefix));
    if (owner)
      matched.push({ discordId: owner.discordId, source: blob });
    else
      unmatched.push(blob);
  }
  return { matched, unmatched };
}

/** `users/<id>/<yyyy>/<mm>/<uuid>-<W>x<H>-t<uploadedAtMs>-<name>.<ext>`, the name the app generates on upload. */
export function migratedPathname(item: MigrationItem, size: { height: number; width: number }) {
  const uploadedAt = item.source.uploadedAt;
  const extension = item.source.pathname.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase() ?? 'jpg';
  const legacyDate = item.source.pathname.match(/-img-(\d{2})-(\d{2})-(\d{4})-/);
  const stem = (legacyDate
    ? `arsip-${legacyDate[1]}-${legacyDate[2]}-${legacyDate[3]}`
    : item.source.pathname.replace(/\.[^.]+$/, ''))
    .replace(/[^\w-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'archive-image';

  return [
    'users',
    item.discordId,
    String(uploadedAt.getUTCFullYear()),
    String(uploadedAt.getUTCMonth() + 1).padStart(2, '0'),
    `${randomUUID()}-${size.width}x${size.height}-t${uploadedAt.getTime()}-${stem}.${extension}`,
  ].join('/');
}

async function listAll(api: BlobApi, prefix?: string) {
  const blobs: StoredBlob[] = [];
  let cursor: string | undefined;
  do {
    const page = await api.list({ cursor, limit: 1_000, prefix });
    blobs.push(...page.blobs);
    cursor = page.hasMore
      ? page.cursor
      : undefined;
  } while (cursor);
  return blobs;
}

async function download(api: BlobApi, pathname: string) {
  for (const access of ['private', 'public'] as const) {
    try {
      const result = await api.get(pathname, { access });
      if (result?.statusCode === 200 && result.stream)
        return Buffer.from(await new Response(result.stream).arrayBuffer());
    }
    catch {
      // Try the other access level.
    }
  }
  throw new Error(`Could not download ${pathname}`);
}

async function upload(api: BlobApi, pathname: string, data: Buffer, contentType: string) {
  const options = {
    addRandomSuffix: false,
    allowOverwrite: false,
    cacheControlMaxAge: 31_536_000,
    contentType,
  };
  try {
    await api.put(pathname, data, { ...options, access: 'private' });
  }
  catch (error) {
    if (!String((error as Error)?.message).includes('Cannot use private access on a public store'))
      throw error;
    await api.put(pathname, data, { ...options, access: 'public' });
  }
}

export async function runMigration(
  api: BlobApi,
  owners: Record<string, string>,
  options: { apply: boolean; log?: (line: string) => void },
) {
  const log = options.log ?? console.log;
  for (const [username, discordId] of Object.entries(owners)) {
    if (!SNOWFLAKE.test(discordId))
      throw new Error(`"${username}" maps to "${discordId}", which is not a Discord ID.`);
  }

  const { matched, unmatched } = planLegacyMigration(await listAll(api), owners);
  log(`${matched.length} legacy file(s) to migrate, ${unmatched.length} without a mapped owner.`);
  for (const blob of unmatched)
    log(`  skip (no owner): ${blob.pathname}`);

  const results = { failed: 0, migrated: 0 };
  for (const item of matched) {
    if (!options.apply) {
      log(`  would move ${item.source.pathname} -> users/${item.discordId}/…`);
      continue;
    }

    try {
      const data = await download(api, item.source.pathname);
      const { autoOrient } = await sharp(data).metadata();
      const target = migratedPathname(item, autoOrient);
      const extension = target.split('.').pop()!;
      await upload(api, target, data, CONTENT_TYPES[extension] ?? 'image/jpeg');
      await api.del(item.source.pathname);

      const variantFolder = `${VARIANT_PREFIX}${createHash('sha256').update(item.source.pathname).digest('hex').slice(0, 24)}/`;
      for (const variant of await listAll(api, variantFolder))
        await api.del(variant.pathname);

      results.migrated += 1;
      log(`  moved ${item.source.pathname} -> ${target}`);
    }
    catch (error) {
      results.failed += 1;
      log(`  FAILED ${item.source.pathname}: ${(error as Error).message}`);
    }
  }

  return results;
}

async function clearSharedIndex(log: (line: string) => void) {
  const url = process.env.NUXT_REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.NUXT_REDIS_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token)
    return;
  const { Redis } = await import('@upstash/redis');
  await new Redis({ url, token }).del(INDEX_KEY);
  log('Cleared the shared archive index; the app rebuilds it on the next request.');
}

async function main() {
  const args = process.argv.slice(2);
  const mapPath = args[args.indexOf('--map') + 1];
  const apply = args.includes('--apply');
  if (!args.includes('--map') || !mapPath) {
    console.error('Usage: bun scripts/migrate-legacy-owners.ts --map owners.json [--apply]');
    process.exit(1);
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('BLOB_READ_WRITE_TOKEN is not set.');
    process.exit(1);
  }

  const owners = JSON.parse(await readFile(mapPath, 'utf8')) as Record<string, string>;
  const blob = await import('@vercel/blob');
  const results = await runMigration(blob as unknown as BlobApi, owners, { apply });

  if (!apply) {
    console.log('Dry run only. Re-run with --apply to migrate.');
    return;
  }
  if (results.migrated)
    await clearSharedIndex(console.log);
  console.log(`Done: ${results.migrated} migrated, ${results.failed} failed.`);
  if (results.failed)
    process.exit(1);
}

if (import.meta.main)
  await main();
