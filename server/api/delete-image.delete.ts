import { del } from '@vercel/blob';

interface CustomUser {
  username: string;
}

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized. Please log in first.' });
  }

  const user = session.user as CustomUser;
  const username = user.username.replace(/\s+/g, '_');

  const body = await readBody(event);
  const { url } = body;

  if (!url) {
    throw createError({ statusCode: 400, statusMessage: 'Image URL is required.' });
  }

  try {
    const urlParts = url.split('/');
    const filename = urlParts[urlParts.length - 1];

    if (!filename.startsWith(`${username}-`)) {
      throw createError({ statusCode: 403, statusMessage: 'You can only delete your own images.' });
    }

    await del(url);

    return { success: true, message: 'Image deleted successfully.' };
  }
  catch (error) {
    console.error('Failed to delete image:', error);
    throw createError({ statusCode: 500, statusMessage: 'Failed to delete image.' });
  }
});
