export default eventHandler(async (event) => {
  const form = await readFormData(event);
  const file = form.get('file') as File;

  if (!file || !file.size) {
    throw createError({ statusCode: 400, message: 'No file provided' });
  }

  ensureBlob(file, {
    maxSize: '2MB',
    types: ['image/jpeg', 'image/png'],
  });

  return hubBlob().put(file.name, file, {
    addRandomSuffix: true,
    prefix: 'images',
  });
});
