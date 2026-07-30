import type { ListBlobResultBlob } from '@vercel/blob';
import type { H3Event } from 'h3';
import type { ArchiveImage, ArchiveImagePage } from '~~/shared/types/images';
import { Buffer } from 'node:buffer';
import { BlobAccessError, get, list } from '@vercel/blob';

interface UserCursor {
  legacyCursor?: string;
  legacyDone?: boolean;
  modernCursor?: string;
  modernDone?: boolean;
}

interface BlobPageCacheEntry {
  expiresAt: number;
  value: Awaited<ReturnType<typeof list>>;
}

const blobPageCache = new Map<string, BlobPageCacheEntry>();
const LIST_CACHE_TTL_MS = 20_000;

function encodeCursor(cursor: UserCursor) {
  return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url');
}

function decodeCursor(cursor: string | undefined): UserCursor {
  if (!cursor)
    return {};

  try {
    return JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as UserCursor;
  }
  catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid pagination cursor.' });
  }
}

function displayName(pathname: string) {
  const filename = pathname.split('/').pop() || 'archive-image';
  const modernName = filename.replace(/^[0-9a-f-]{36}-/i, '').replace(/\.[^.]+$/, '');

  if (modernName !== filename.replace(/\.[^.]+$/, ''))
    return modernName.replace(/[-_]+/g, ' ');

  const legacyDate = filename.match(/-img-(\d{2})-(\d{2})-(\d{4})-/);
  if (legacyDate)
    return `Arsip ${legacyDate[1]}-${legacyDate[2]}-${legacyDate[3]}`;

  if (!pathname.startsWith('users/'))
    return 'Arsip gambar';

  return modernName.replace(/[-_]+/g, ' ');
}

export function toArchiveImage(event: H3Event, blob: ListBlobResultBlob): ArchiveImage {
  return {
    etag: blob.etag,
    id: toArchiveReference(event, blob.pathname),
    name: displayName(blob.pathname),
    size: blob.size,
    uploadedAt: blob.uploadedAt.toISOString(),
  };
}

async function listCached(options: Parameters<typeof list>[0]) {
  const key = JSON.stringify(options || {});
  const cached = blobPageCache.get(key);
  if (cached && cached.expiresAt > Date.now())
    return cached.value;

  const value = await list(options);
  blobPageCache.set(key, {
    expiresAt: Date.now() + LIST_CACHE_TTL_MS,
    value,
  });
  return value;
}

export function invalidateArchiveImageCache() {
  blobPageCache.clear();
}

export async function listArchiveImages(
  event: H3Event,
  limit: number,
  cursor?: string,
): Promise<ArchiveImagePage> {
  const result = await listCached({ limit, cursor });

  return {
    items: result.blobs.map(blob => toArchiveImage(event, blob)),
    cursor: result.cursor || null,
    hasMore: result.hasMore,
  };
}

export async function listUserArchiveImages(
  event: H3Event,
  user: { discordId: string; username: string },
  limit: number,
  cursor?: string,
): Promise<ArchiveImagePage> {
  const state = decodeCursor(cursor);
  const modernPrefix = `users/${user.discordId}/`;
  const legacyPrefix = `${user.username.replace(/\s+/g, '_')}-`;

  const modernLimit = state.legacyDone ? limit : Math.ceil(limit / 2);
  const legacyLimit = state.modernDone ? limit : Math.floor(limit / 2);

  const [modern, legacy] = await Promise.all([
    state.modernDone
      ? null
      : listCached({ prefix: modernPrefix, limit: modernLimit, cursor: state.modernCursor }),
    state.legacyDone || legacyLimit === 0
      ? null
      : listCached({ prefix: legacyPrefix, limit: legacyLimit, cursor: state.legacyCursor }),
  ]);

  const nextState: UserCursor = {
    modernCursor: modern?.cursor,
    modernDone: state.modernDone || !modern?.hasMore,
    legacyCursor: legacy?.cursor,
    legacyDone: state.legacyDone || !legacy?.hasMore,
  };

  const blobs = [
    ...(modern?.blobs || []),
    ...(legacy?.blobs || []),
  ].sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());

  const hasMore = !(nextState.modernDone && nextState.legacyDone);
  return {
    items: blobs.map(blob => toArchiveImage(event, blob)),
    cursor: hasMore ? encodeCursor(nextState) : null,
    hasMore,
  };
}

export function assertImageOwnership(
  pathname: string,
  user: { discordId: string; username: string },
) {
  const ownsModernImage = pathname.startsWith(`users/${user.discordId}/`);
  const ownsLegacyImage = pathname.startsWith(`${user.username.replace(/\s+/g, '_')}-`);
  if (!ownsModernImage && !ownsLegacyImage) {
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
