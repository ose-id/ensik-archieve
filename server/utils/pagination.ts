import type { H3Event } from 'h3';

export function getImagePagination(event: H3Event) {
  const query = getQuery(event);
  const requestedLimit = Number(query.limit);
  const limit = Number.isInteger(requestedLimit)
    ? Math.min(60, Math.max(1, requestedLimit))
    : 30;

  const cursor = typeof query.cursor === 'string' && query.cursor.length <= 1_024
    ? query.cursor
    : undefined;

  return { cursor, limit };
}
