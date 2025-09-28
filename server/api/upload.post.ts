import { randomBytes } from 'node:crypto';
import { put } from '@vercel/blob';

interface CustomUser {
  username: string;
}

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];
const MAX_SIZE = 2 * 1024 * 1024;

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized. Please log in first.' });
  }

  const user = session.user as CustomUser;
  const username = user.username.replace(/\s+/g, '_');

  const formData = await readMultipartFormData(event);
  if (!formData) {
    throw createError({ statusCode: 400, statusMessage: 'No file uploaded' });
  }

  const file = formData.find(file => file.type && ALLOWED_TYPES.includes(file.type));
  if (!file || !file.name) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid file type. Only PNG, JPG, and JPEG are allowed.' });
  }

  if (file.data.length > MAX_SIZE) {
    throw createError({ statusCode: 400, statusMessage: 'File size exceeds 2MB limit.' });
  }

  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = String(now.getFullYear());
  const formattedDate = `${day}-${month}-${year}`;

  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const randomSegment = Array.from(randomBytes(5))
    .map(byte => characters[byte % characters.length])
    .join('');

  const extensionMatch = file.name.match(/\.[^.]+$/);
  const extension = extensionMatch ? extensionMatch[0].toLowerCase() : '';

  const fileName = `${username}-img-${formattedDate}-${randomSegment}${extension}`;

  try {
    const blob = await put(fileName, file.data, {
      access: 'public',
    });

    return {
      url: blob.url,
      pathname: blob.pathname,
    };
  }
  catch (error) {
    console.error('Upload failed:', error);
    throw createError({ statusCode: 500, statusMessage: 'Failed to upload file.' });
  }
});
