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

type ArchiveBlob = Pick<ListBlobResultBlob, 'etag' | 'pathname' | 'size' | 'uploadedAt'>;
type IndexCursor = [uploadedAt: number, pathname: string];

const INDEX_TTL_MS = 60_000;
const LIST_PAGE_SIZE = 1_000;
const MODERN_PREFIX_PATTERN = /^[0-9a-f-]{36}-(?:(\d{1,5})x(\d{1,5})-)?/i;

let archiveIndex: { entries: ArchiveIndexEntry[]; expiresAt: number } | undefined;
let pendingIndex: Promise<ArchiveIndexEntry[]> | undefined;

function compareNewestFirst(left: ArchiveIndexEntry, right: ArchiveIndexEntry) {
  return right.uploadedAt - left.uploadedAt || right.pathname.localeCompare(left.pathname);
}

function encodeCursor(entry: ArchiveIndexEntry) {
  const cursor: IndexCursor = [entry.uploadedAt, entry.pathname];
  return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url');
}

function decodeCursor(cursor: string | undefined) {
  if (!cursor)
    return undefined;

  try {
    const [uploadedAt, pathname] = JSON.parse(
      Buffer.from(cursor, 'base64url').toString('utf8'),
    ) as IndexCursor;
    if (Number.isFinite(uploadedAt) && typeof pathname === 'string')
      return { uploadedAt, pathname };
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
  },
): Promise<ArchiveImagePage> {
  const { cursor, limit, order = 'desc', owner } = options;
  const after = decodeCursor(cursor);
  let entries = await getArchiveIndex();
  if (owner)
    entries = entries.filter(entry => isOwnedBy(entry.pathname, owner));
  if (order === 'asc')
    entries = entries.toReversed();

  const direction = order === 'asc'
    ? -1
    : 1;
  const start = after
    ? entries.findIndex(entry => compareNewestFirst(entry, after as ArchiveIndexEntry) * direction > 0)
    : 0;
  const page = start === -1
    ? []
    : entries.slice(start, start + limit);
  const hasMore = start !== -1 && start + limit < entries.length;

  return {
    cursor: hasMore
      ? encodeCursor(page.at(-1)!)
      : null,
    hasMore,
    items: page.map(entry => toArchiveImageFromEntry(event, entry)),
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
