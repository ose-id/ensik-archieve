import { list } from '@vercel/blob';

export default defineEventHandler(async () => {
  const { blobs } = await list();
  return Response.json(blobs);
});
