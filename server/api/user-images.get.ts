import { list } from '@vercel/blob';

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

  try {
    const { blobs } = await list();
    const userBlobs = blobs.filter(blob =>
      blob.pathname.startsWith(`${username}-`),
    );

    return userBlobs;
  }
  catch (error) {
    console.error('Failed to fetch user images:', error);
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch images.' });
  }
});
