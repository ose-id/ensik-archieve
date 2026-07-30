import { del } from '@vercel/blob';

export default defineEventHandler(async (event) => {
  assertSameOrigin(event);
  assertRateLimit(event, 'image-delete', 60, 60 * 60 * 1000);
  const user = await requireOAuthUser(event);
  const body = await readBody<{ etag?: unknown; id?: unknown }>(event);

  if (
    typeof body?.id !== 'string'
    || body.id.length > 1_024
    || !/^[\w-]+$/.test(body.id)
  ) {
    throw createError({ statusCode: 400, statusMessage: 'A valid image ID is required.' });
  }

  if (typeof body.etag !== 'string' || !body.etag || body.etag.length > 256) {
    throw createError({ statusCode: 400, statusMessage: 'A valid image ETag is required.' });
  }

  const pathname = validateArchivePathname(fromArchiveReference(event, body.id));
  assertImageOwnership(pathname, user);
  await del(pathname, { ifMatch: body.etag });
  invalidateArchiveImageCache();

  return { success: true };
});
