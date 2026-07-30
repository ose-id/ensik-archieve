export default defineEventHandler(async (event) => {
  const user = await requireOAuthUser(event);
  const { cursor, limit } = getImagePagination(event);
  setResponseHeader(event, 'Cache-Control', 'private, no-store');
  return listUserArchiveImages(event, user, limit, cursor);
});
