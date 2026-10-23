export default defineEventHandler(async (event) => {
  const user = await requireOAuthUser(event);
  const { cursor, limit, order } = getImagePagination(event);
  setResponseHeader(event, 'Cache-Control', 'private, no-store');
  return listArchiveImages(event, { cursor, limit, order, owner: user });
});
