import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';
import { del, list } from '@vercel/blob';

/**
 * Resized images are cached in the same Blob store under `variants/`, one folder
 * per source image, so they can be found again and removed with the original.
 */
const VARIANT_PREFIX = 'variants/';

function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

export function isArchiveVariantPath(pathname: string) {
  return pathname.startsWith(VARIANT_PREFIX);
}

function variantFolder(sourcePathname: string) {
  return `${VARIANT_PREFIX}${sha256(sourcePathname).slice(0, 24)}/`;
}

/** `variantKey` must change whenever the output would (source etag, size, quality, format, fit). */
export function variantPathname(sourcePathname: string, variantKey: string, format: string) {
  return `${variantFolder(sourcePathname)}${sha256(variantKey).slice(0, 32)}.${format}`;
}

export async function readArchiveVariant(pathname: string) {
  try {
    const result = await readArchiveBlob(pathname);
    if (result?.statusCode === 200 && result.stream)
      return Buffer.from(await new Response(result.stream).arrayBuffer());
  }
  catch {
    // A missing or unreadable variant is just regenerated.
  }
  return null;
}

export async function writeArchiveVariant(pathname: string, data: Buffer, contentType: string) {
  try {
    await writeArchiveBlob(pathname, data, { allowOverwrite: true, contentType });
  }
  catch (error) {
    console.warn('[archive-variant] Could not cache variant.', error);
  }
}

/** Removes every cached variant of an image, e.g. after it is deleted. */
export async function deleteArchiveVariants(sourcePathname: string) {
  const prefix = variantFolder(sourcePathname);
  try {
    let cursor: string | undefined;
    do {
      const page = await list({ cursor, prefix, limit: 1_000 });
      if (page.blobs.length)
        await del(page.blobs.map(blob => blob.url));
      cursor = page.hasMore
        ? page.cursor
        : undefined;
    } while (cursor);
  }
  catch (error) {
    console.warn('[archive-variant] Could not delete variants.', error);
  }
}
