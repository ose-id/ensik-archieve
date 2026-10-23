import type { ListBlobResultBlob } from '@vercel/blob';
import type { H3Event } from 'h3';
import type { ArchiveImage, ArchiveImagePage, ArchiveSortOrder } from '~~/shared/types/images';
import { Buffer } from 'node:buffer';
import { BlobAccessError, get, list } from '@vercel/blob';

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
  username: string;
}

interface RankedEntry {
  entry: ArchiveIndexEntry;
  key: number;
  pathname: string;
}

type ArchiveBlob = Pick<ListBlobResultBlob, 'etag' | 'pathname' | 'size' | 'uploadedAt'>;
type IndexCursor = [key: number, pathname: string];

const INDEX_TTL_MS = 60_000;
const LIST_PAGE_SIZE = 1_000;
const MODERN_PREFIX_PATTERN = /^[0-9a-f-]{36}-(?:(\d{1,5})x(\d{1,5})-)?/i;

let archiveIndex: { entries: ArchiveIndexEntry[]; expiresAt: number } | undefined;
let pendingIndex: Promise<ArchiveIndexEntry[]> | undefined;

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

function parseDimensions(pathname: string) {
  const match = filename(pathname).match(MODERN_PREFIX_PATTERN);
  const width = Number(match?.[1]);
  const height = Number(match?.[2]);
  return width > 0 && height > 0
    ? { width, height }
    : { width: null, height: null };
}

/** Filename without the UUID/dimension prefix and extension added on upload. */
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
  return {
    etag: blob.etag,
    pathname: blob.pathname,
    size: blob.size,
    uploadedAt: blob.uploadedAt.getTime(),
    ...parseDimensions(blob.pathname),
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

async function loadArchiveIndex() {
  const entries: ArchiveIndexEntry[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ cursor, limit: LIST_PAGE_SIZE });
    entries.push(...page.blobs.map(toIndexEntry));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  return entries.sort(compareNewestFirst);
}

/**
 * Every archived image, newest first. Vercel Blob can only list by pathname,
 * so the whole store is listed once per TTL and sorted by upload time here.
 */
async function getArchiveIndex() {
  if (archiveIndex && archiveIndex.expiresAt > Date.now())
    return archiveIndex.entries;

  pendingIndex ??= loadArchiveIndex()
    .then((entries) => {
      archiveIndex = { entries, expiresAt: Date.now() + INDEX_TTL_MS };
      return entries;
    })
    .finally(() => {
      pendingIndex = undefined;
    });

  return pendingIndex;
}

export function rememberArchiveImage(blob: ArchiveBlob) {
  if (!archiveIndex)
    return;

  const entry = toIndexEntry(blob);
  const entries = archiveIndex.entries.filter(item => item.pathname !== entry.pathname);
  const position = entries.findIndex(item => compareNewestFirst(entry, item) < 0);
  entries.splice(position === -1
    ? entries.length
    : position, 0, entry);
  archiveIndex.entries = entries;
}

export function forgetArchiveImage(pathname: string) {
  if (archiveIndex)
    archiveIndex.entries = archiveIndex.entries.filter(item => item.pathname !== pathname);
}

function isOwnedBy(pathname: string, owner: ArchiveOwner) {
  return pathname.startsWith(`users/${owner.discordId}/`)
    || pathname.startsWith(`${owner.username.replace(/\s+/g, '_')}-`);
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

export async function readArchiveBlob(event: H3Event, pathname: string) {
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
