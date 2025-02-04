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

  const fileName = `${username}-${Date.now()}-${file.name}`;

  try {
    const blob = await put(fileName, file.data, {
      access: 'public',
    });

    return { url: blob.url };
  }
  catch (error) {
    console.error('Upload failed:', error);
    throw createError({ statusCode: 500, statusMessage: 'Failed to upload file.' });
  }
});
