import type { ListBlobResultBlob } from '@vercel/blob';
import type { H3Event } from 'h3';
import type { ArchiveImage, ArchiveImagePage, ArchiveSortOrder } from '~~/shared/types/images';
import { Buffer } from 'node:buffer';
import { BlobAccessError, get, list, put } from '@vercel/blob';

interface ArchiveIndexEntry {
  etag: string;
  height: number | null;
  pathname: string;
  size: number;
  uploadedAt: number;
  width: number | null;
}

interface ArchiveOwner {
  discordId: string;
}

interface RankedEntry {
  entry: ArchiveIndexEntry;
  key: number;
  pathname: string;
}

interface StoredIndex {
  builtAt: number;
  entries: ArchiveIndexEntry[];
}

type ArchiveBlob = Pick<ListBlobResultBlob, 'etag' | 'pathname' | 'size' | 'uploadedAt'>;
type IndexCursor = [key: number, pathname: string];

/** How long an instance trusts its in-memory copy before checking the shared one again. */
const MEMORY_TTL_MS = 15_000;
/** Memory-only fallback (no Redis): how long before listing the whole store again. */
const MEMORY_ONLY_TTL_MS = 60_000;
/** The shared copy in Redis is rebuilt from Blob at most this often, healing any missed update. */
const REBUILD_AFTER_MS = 10 * 60_000;
const INDEX_KEY = 'ensik:archive-index:v1';
const LIST_PAGE_SIZE = 1_000;
/**
 * Generated filenames: `<uuid>-<W>x<H>-t<uploadedAtMs>-<name>.<ext>`. Dimensions
 * and the timestamp are optional; the timestamp keeps the original upload time
 * for files that were moved (Blob resets `uploadedAt` on copy).
 */
const MODERN_PREFIX_PATTERN = /^[0-9a-f-]{36}-(?:(\d{1,5})x(\d{1,5})-)?(?:t(\d{13})-)?/i;

let memoryIndex: { entries: ArchiveIndexEntry[]; expiresAt: number } | undefined;
let pendingIndex: Promise<ArchiveIndexEntry[]> | undefined;
const entriesByPath = new WeakMap<ArchiveIndexEntry[], Map<string, ArchiveIndexEntry>>();

function compareNewestFirst(left: ArchiveIndexEntry, right: ArchiveIndexEntry) {
  return right.uploadedAt - left.uploadedAt || right.pathname.localeCompare(left.pathname);
}

function compareRanked(left: Pick<RankedEntry, 'key' | 'pathname'>, right: Pick<RankedEntry, 'key' | 'pathname'>) {
  return left.key - right.key || left.pathname.localeCompare(right.pathname);
}

/**
 * Pseudo-random but stable rank (FNV-1a + murmur finaliser): a seed always
 * yields the same order, and adding or removing an image never moves the others,
 * so seeded pages can still use keyset cursors.
 */
function seededRank(seed: number, pathname: string) {
  let hash = (2166136261 ^ seed) >>> 0;
  for (let index = 0; index < pathname.length; index += 1) {
    hash ^= pathname.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85EBCA6B);
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 0xC2B2AE35);
  hash ^= hash >>> 16;
  return hash >>> 0;
}

function encodeCursor(item: RankedEntry) {
  const cursor: IndexCursor = [item.key, item.pathname];
  return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url');
}

function decodeCursor(cursor: string | undefined) {
  if (!cursor)
    return undefined;

  try {
    const [key, pathname] = JSON.parse(
      Buffer.from(cursor, 'base64url').toString('utf8'),
    ) as IndexCursor;
    if (Number.isFinite(key) && typeof pathname === 'string')
      return { key, pathname };
  }
  catch {}

  throw createError({ statusCode: 400, statusMessage: 'Invalid pagination cursor.' });
}

function filename(pathname: string) {
  return pathname.split('/').pop() || 'archive-image';
}

function parseGeneratedName(pathname: string) {
  const match = filename(pathname).match(MODERN_PREFIX_PATTERN);
  const width = Number(match?.[1]);
  const height = Number(match?.[2]);
  const uploadedAt = Number(match?.[3]);
  return {
    height: width > 0 && height > 0
      ? height
      : null,
    uploadedAt: uploadedAt > 0
      ? uploadedAt
      : null,
    width: width > 0 && height > 0
      ? width
      : null,
  };
}

/** Filename without the UUID/dimension/timestamp prefix and extension added on upload. */
export function archiveFileStem(pathname: string) {
  return filename(pathname)
    .replace(MODERN_PREFIX_PATTERN, '')
    .replace(/\.[^.]+$/, '');
}

function displayName(pathname: string) {
  const name = filename(pathname);
  if (MODERN_PREFIX_PATTERN.test(name))
    return archiveFileStem(pathname).replace(/[-_]+/g, ' ');

  const legacyDate = name.match(/-img-(\d{2})-(\d{2})-(\d{4})-/);
  if (legacyDate)
    return `Arsip ${legacyDate[1]}-${legacyDate[2]}-${legacyDate[3]}`;

  if (!pathname.startsWith('users/'))
    return 'Arsip gambar';

  return archiveFileStem(pathname).replace(/[-_]+/g, ' ');
}

function toIndexEntry(blob: ArchiveBlob): ArchiveIndexEntry {
  const parsed = parseGeneratedName(blob.pathname);
  return {
    etag: blob.etag,
    height: parsed.height,
    pathname: blob.pathname,
    size: blob.size,
    uploadedAt: parsed.uploadedAt ?? blob.uploadedAt.getTime(),
    width: parsed.width,
  };
}

function toArchiveImageFromEntry(event: H3Event, entry: ArchiveIndexEntry): ArchiveImage {
  return {
    etag: entry.etag,
    height: entry.height,
    id: toArchiveReference(event, entry.pathname),
    name: displayName(entry.pathname),
    size: entry.size,
    uploadedAt: new Date(entry.uploadedAt).toISOString(),
    width: entry.width,
  };
}

export function toArchiveImage(event: H3Event, blob: ArchiveBlob): ArchiveImage {
  return toArchiveImageFromEntry(event, toIndexEntry(blob));
}

async function listEveryArchiveBlob() {
  const entries: ArchiveIndexEntry[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ cursor, limit: LIST_PAGE_SIZE });
    for (const blob of page.blobs) {
      // Cached image variants live in the same store but aren't archive images.
      if (!isArchiveVariantPath(blob.pathname))
        entries.push(toIndexEntry(blob));
    }
    cursor = page.hasMore
      ? page.cursor
      : undefined;
  } while (cursor);

  return entries.sort(compareNewestFirst);
}

async function readSharedIndex() {
  const redis = useRedis();
  if (!redis)
    return null;
  try {
    return parseStored<StoredIndex>(await redis.get(INDEX_KEY));
  }
  catch (error) {
    console.warn('[archive-index] Could not read the shared index.', error);
    return null;
  }
}

async function writeSharedIndex(index: StoredIndex) {
  const redis = useRedis();
  if (!redis)
    return;
  try {
    await redis.set(INDEX_KEY, JSON.stringify(index));
  }
  catch (error) {
    console.warn('[archive-index] Could not write the shared index.', error);
  }
}

async function loadArchiveIndex() {
  const shared = await readSharedIndex();
  if (shared && Date.now() - shared.builtAt < REBUILD_AFTER_MS)
    return shared.entries;

  const entries = await listEveryArchiveBlob();
  await writeSharedIndex({
    builtAt: Date.now(),
    entries,
  });
  return entries;
}

/**
 * Every archived image, newest first. Vercel Blob can only list by pathname, so
 * the store is listed and sorted here. With Redis the result is shared by every
 * instance and only rebuilt every few minutes; without it each instance keeps
 * its own copy.
 */
async function getArchiveIndex() {
  if (memoryIndex && memoryIndex.expiresAt > Date.now())
    return memoryIndex.entries;

  pendingIndex ??= loadArchiveIndex()
    .then((entries) => {
      const ttl = useRedis()
        ? MEMORY_TTL_MS
        : MEMORY_ONLY_TTL_MS;
      memoryIndex = { entries, expiresAt: Date.now() + ttl };
      return entries;
    })
    .finally(() => {
      pendingIndex = undefined;
    });

  return pendingIndex;
}

/** Applies an upload or delete to the memory copy and, if present, the shared copy. */
async function updateArchiveIndex(change: (entries: ArchiveIndexEntry[]) => ArchiveIndexEntry[]) {
  if (memoryIndex)
    memoryIndex.entries = change(memoryIndex.entries);

  // Read-modify-write: a concurrent update can be lost, which the periodic rebuild repairs.
  const shared = await readSharedIndex();
  if (shared) {
    await writeSharedIndex({
      builtAt: shared.builtAt,
      entries: change(shared.entries),
    });
  }
}

export async function rememberArchiveImage(blob: ArchiveBlob) {
  const entry = toIndexEntry(blob);
  await updateArchiveIndex((entries) => {
    const next = entries.filter(item => item.pathname !== entry.pathname);
    const position = next.findIndex(item => compareNewestFirst(entry, item) < 0);
    next.splice(position === -1
      ? next.length
      : position, 0, entry);
    return next;
  });
}

export async function forgetArchiveImage(pathname: string) {
  await updateArchiveIndex(entries => entries.filter(item => item.pathname !== pathname));
}

/** Index entry for one image, used to validate cache keys without touching Blob. */
export async function findArchiveEntry(pathname: string) {
  const entries = await getArchiveIndex();
  let byPath = entriesByPath.get(entries);
  if (!byPath) {
    byPath = new Map(entries.map(entry => [entry.pathname, entry]));
    entriesByPath.set(entries, byPath);
  }
  return byPath.get(pathname);
}

/** Images belong to the Discord account in their `users/<id>/` folder. */
function isOwnedBy(pathname: string, owner: ArchiveOwner) {
  return pathname.startsWith(`users/${owner.discordId}/`);
}

export async function listArchiveImages(
  event: H3Event,
  options: {
    cursor?: string;
    limit: number;
    order?: ArchiveSortOrder;
    owner?: ArchiveOwner;
    /** Shuffles the archive in a stable order for this seed instead of sorting by upload time. */
    seed?: number;
  },
): Promise<ArchiveImagePage> {
  const { cursor, limit, order = 'desc', owner, seed } = options;
  const after = decodeCursor(cursor);
  let entries = await getArchiveIndex();
  if (owner)
    entries = entries.filter(entry => isOwnedBy(entry.pathname, owner));

  const ranked: RankedEntry[] = entries.map(entry => ({
    entry,
    key: seed === undefined
      ? entry.uploadedAt
      : seededRank(seed, entry.pathname),
    pathname: entry.pathname,
  }));
  // Chronological "desc" means newest first; every other ordering ascends by key.
  const direction = seed === undefined && order === 'desc'
    ? -1
    : 1;
  ranked.sort((left, right) => compareRanked(left, right) * direction);

  const start = after
    ? ranked.findIndex(item => compareRanked(item, after) * direction > 0)
    : 0;
  const page = start === -1
    ? []
    : ranked.slice(start, start + limit);
  const hasMore = start !== -1 && start + limit < ranked.length;

  return {
    cursor: hasMore
      ? encodeCursor(page.at(-1)!)
      : null,
    hasMore,
    items: page.map(item => toArchiveImageFromEntry(event, item.entry)),
    total: entries.length,
    totalSize: entries.reduce((total, entry) => total + entry.size, 0),
  };
}

export function assertImageOwnership(pathname: string, owner: ArchiveOwner) {
  if (!isOwnedBy(pathname, owner)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'You can only modify your own images.',
    });
  }
}

export function validateArchivePathname(pathname: string) {
  const normalized = pathname.replaceAll('\\', '/').replace(/^\/+/, '');
  if (
    !normalized
    || normalized.length > 512
    || normalized.includes('\0')
    || normalized.split('/').some(segment => !segment || segment === '.' || segment === '..')
  ) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid image pathname.' });
  }

  return normalized;
}

export async function readArchiveBlob(pathname: string) {
  try {
    const result = await get(pathname, { access: 'private' });
    if (result)
      return result;
  }
  catch (error) {
    if (!(error instanceof BlobAccessError))
      throw error;
  }

  return get(pathname, { access: 'public' });
}

/** Stores a file privately, falling back to public access on stores that don't support private blobs. */
export async function writeArchiveBlob(
  pathname: string,
  data: Buffer,
  options: { allowOverwrite?: boolean; contentType: string },
) {
  const putOptions = {
    addRandomSuffix: false,
    allowOverwrite: options.allowOverwrite ?? false,
    cacheControlMaxAge: 31_536_000,
    contentType: options.contentType,
  };

  try {
    return await put(pathname, data, { ...putOptions, access: 'private' });
  }
  catch (error) {
    const message = error instanceof Error
      ? error.message
      : '';
    if (!message.includes('Cannot use private access on a public store'))
      throw error;
    return put(pathname, data, { ...putOptions, access: 'public' });
  }
}
