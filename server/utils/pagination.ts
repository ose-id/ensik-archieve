import type { H3Event } from 'h3';
import type { ArchiveSortOrder } from '~~/shared/types/images';

export function getImagePagination(event: H3Event) {
  const query = getQuery(event);
  const requestedLimit = Number(query.limit);
  const limit = Number.isInteger(requestedLimit)
    ? Math.min(60, Math.max(1, requestedLimit))
    : 30;

  const cursor = typeof query.cursor === 'string' && query.cursor.length <= 1_024
    ? query.cursor
    : undefined;

  const order: ArchiveSortOrder = query.order === 'asc'
    ? 'asc'
    : 'desc';

  const requestedSeed = Number(query.seed);
  const seed = Number.isInteger(requestedSeed) && requestedSeed >= 0 && requestedSeed <= 0xFFFFFFFF
    ? requestedSeed
    : undefined;

  return { cursor, limit, order, seed };
}
