import type { PutBlobResult } from '@vercel/blob';
import type { UploadedArchiveImage } from '~~/shared/types/images';
import { randomUUID } from 'node:crypto';
import { head, put } from '@vercel/blob';

export default defineEventHandler(async (event) => {
  assertSameOrigin(event);
  assertRateLimit(event, 'image-upload', 20, 60 * 60 * 1000);
  const user = await requireOAuthUser(event);

  const contentLength = Number(getRequestHeader(event, 'content-length'));
  if (Number.isFinite(contentLength) && contentLength > MAX_MULTIPART_SIZE) {
    throw createError({
      statusCode: 413,
      statusMessage: 'Upload exceeds the 3 MB image limit.',
    });
  }

  const formData = await readMultipartFormData(event);
  if (!formData || formData.length !== 1) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Upload exactly one image at a time.',
    });
  }

  const file = formData[0];
  if (!file?.name || !file.data?.length) {
    throw createError({ statusCode: 400, statusMessage: 'No image was uploaded.' });
  }

  if (file.data.length > MAX_IMAGE_SIZE) {
    throw createError({
      statusCode: 413,
      statusMessage: 'Image exceeds the 3 MB limit.',
    });
  }

  const detected = detectImage(file.data);
  if (!detected) {
    throw createError({
      statusCode: 415,
      statusMessage: 'Only valid PNG and JPEG images are supported.',
    });
  }

  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const originalName = file.filename || file.name;
  const pathname = [
    'users',
    user.discordId,
    String(year),
    month,
    `${randomUUID()}-${sanitizeImageName(originalName)}.${detected.extension}`,
  ].join('/');

  let blob: PutBlobResult;
  try {
    blob = await put(pathname, file.data, {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: false,
      cacheControlMaxAge: 31_536_000,
      contentType: detected.mime,
    });
  }
  catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('Cannot use private access on a public store')) {
      blob = await put(pathname, file.data, {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: false,
        cacheControlMaxAge: 31_536_000,
        contentType: detected.mime,
      });
    }
    else {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to upload image to archive storage.',
      });
    }
  }

  let metadata;
  try {
    metadata = await head(blob.pathname);
  }
  catch {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to retrieve uploaded image metadata.',
    });
  }

  invalidateArchiveImageCache();

  return {
    item: toArchiveImage(event, metadata),
  } satisfies UploadedArchiveImage;
});
