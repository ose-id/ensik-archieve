export default defineEventHandler(async (event) => {
  await requireSiteAccess(event);
  const { cursor, limit } = getImagePagination(event);
  setResponseHeader(event, 'Cache-Control', 'private, no-store');
  return listArchiveImages(event, limit, cursor);
});
