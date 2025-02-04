import { put } from '@vercel/blob';

export default defineEventHandler(async (event) => {
  const formData = await readMultipartFormData(event);
  if (!formData) {
    throw createError({ statusCode: 400, statusMessage: 'No file uploaded' });
  }

  const file = formData.find(file => file.type?.startsWith('image/'));
  if (!file || !file.name) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid file type or missing file name' });
  }

  const fileName = file.name || `upload-${Date.now()}`;

  const blob = await put(fileName, file.data, {
    access: 'public',
  });

  return { url: blob.url };
});
