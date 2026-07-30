import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const ALLOWED_FORMATS = new Set(['avif', 'jpeg', 'png', 'webp']);
type ImageFit = 'contain' | 'cover' | 'fill' | 'inside' | 'outside';
const ALLOWED_FITS = new Set<ImageFit>(['contain', 'cover', 'fill', 'inside', 'outside']);

function getDownloadFilename(pathname: string, extension: 'jpg' | 'png') {
  const filename = pathname.split('/').pop() || 'archive-image';
  const stem = filename
    .replace(/^[0-9a-f-]{36}-/i, '')
    .replace(/\.[^.]+$/, '');
  const safeStem = stem
    .replace(/[\r\n"\\]/g, '_')
    .slice(0, 110) || 'archive-image';
  return `${safeStem}.${extension}`;
}

function getContentDisposition(filename: string) {
  const fallback = filename
    .normalize('NFKD')
    .replace(/[^\w.-]+/g, '_');
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

function integerModifier(
  value: unknown,
  minimum: number,
  maximum: number,
  fallback?: number,
) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed))
    return fallback;

  return Math.min(maximum, Math.max(minimum, parsed));
}

export default defineEventHandler(async (event) => {
  await requireSiteAccess(event);
  assertRateLimit(event, 'private-media', 360, 60 * 1000);

  const reference = getRouterParam(event, 'reference');
  if (
    !reference
    || reference.length > 1_024
    || !/^[\w-]+$/.test(reference)
  ) {
    throw createError({ statusCode: 404, statusMessage: 'Image not found.' });
  }

  const pathname = validateArchivePathname(fromArchiveReference(event, reference));
  const query = getQuery(event);
  const isDownload = query.download === '1';

  if (isDownload) {
    assertRateLimit(event, 'image-download', 60, 60 * 60 * 1000);
    const user = await requireOAuthUser(event);
    assertImageOwnership(pathname, user);
  }

  const source = await readArchiveBlob(event, pathname);
  if (!source || source.statusCode !== 200 || !source.stream) {
    throw createError({ statusCode: 404, statusMessage: 'Image not found.' });
  }

  if (source.blob.size > 20 * 1024 * 1024) {
    throw createError({ statusCode: 413, statusMessage: 'Source image is too large.' });
  }

  if (isDownload) {
    const input = Buffer.from(await new Response(source.stream).arrayBuffer());
    const detected = detectImage(input);
    if (!detected) {
      throw createError({
        statusCode: 415,
        statusMessage: 'Archived file is not a supported image.',
      });
    }

    const filename = getDownloadFilename(pathname, detected.extension);
    setResponseHeaders(event, {
      'Cache-Control': 'private, no-store',
      'Content-Disposition': getContentDisposition(filename),
      'Content-Length': String(input.byteLength),
      'Content-Type': detected.mime,
      'ETag': `"${source.blob.etag}"`,
      'Vary': 'Cookie',
    });
    return input;
  }

  const width = integerModifier(query.w, 16, 1_920);
  const height = integerModifier(query.h, 16, 1_920);
  const quality = integerModifier(query.q, 20, 100, 76)!;
  const requestedFormat = typeof query.f === 'string' ? query.f.toLowerCase() : 'webp';
  const format = ALLOWED_FORMATS.has(requestedFormat) ? requestedFormat : 'webp';
  const requestedFit = typeof query.fit === 'string' ? query.fit.toLowerCase() : 'cover';
  const fit: ImageFit = ALLOWED_FITS.has(requestedFit as ImageFit)
    ? requestedFit as ImageFit
    : 'cover';

  if (!width && !height) {
    throw createError({
      statusCode: 400,
      statusMessage: 'A valid image width or height is required.',
    });
  }

  const variant = `${source.blob.etag}:${width || ''}:${height || ''}:${quality}:${format}:${fit}`;
  const etag = `"${createHash('sha256').update(variant).digest('base64url')}"`;
  if (getRequestHeader(event, 'if-none-match') === etag) {
    setResponseStatus(event, 304);
    return null;
  }

  const input = Buffer.from(await new Response(source.stream).arrayBuffer());
  let image = sharp(input, {
    failOn: 'warning',
    limitInputPixels: 40_000_000,
  })
    .rotate()
    .resize({
      width,
      height,
      fit,
      withoutEnlargement: true,
    });

  if (format === 'avif')
    image = image.avif({ quality, effort: 4 });
  else if (format === 'jpeg')
    image = image.jpeg({ quality, mozjpeg: true });
  else if (format === 'png')
    image = image.png({ compressionLevel: 8, quality });
  else
    image = image.webp({ quality, effort: 4 });

  const output = await image.toBuffer();
  setResponseHeaders(event, {
    'Cache-Control': 'private, max-age=86400, stale-while-revalidate=604800',
    'Content-Length': String(output.byteLength),
    'Content-Type': `image/${format}`,
    'ETag': etag,
    'Vary': 'Cookie',
  });

  return output;
});
