export const MAX_IMAGE_SIZE = 3 * 1024 * 1024;
export const MAX_MULTIPART_SIZE = MAX_IMAGE_SIZE + 64 * 1024;

interface DetectedImage {
  extension: 'jpg' | 'png';
  mime: 'image/jpeg' | 'image/png';
}

export function detectImage(data: Uint8Array): DetectedImage | null {
  const isPng = data.length >= 8
    && data[0] === 0x89
    && data[1] === 0x50
    && data[2] === 0x4E
    && data[3] === 0x47
    && data[4] === 0x0D
    && data[5] === 0x0A
    && data[6] === 0x1A
    && data[7] === 0x0A;

  if (isPng)
    return { extension: 'png', mime: 'image/png' };

  const isJpeg = data.length >= 4
    && data[0] === 0xFF
    && data[1] === 0xD8
    && data[2] === 0xFF
    && data[data.length - 2] === 0xFF
    && data[data.length - 1] === 0xD9;

  return isJpeg ? { extension: 'jpg', mime: 'image/jpeg' } : null;
}

export function sanitizeImageName(filename: string) {
  const stem = filename
    .normalize('NFKD')
    .replace(/\.[^.]+$/, '')
    .replace(/[^\w-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

  return stem || 'archive-image';
}
