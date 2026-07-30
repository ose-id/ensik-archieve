export default defineEventHandler(async (event) => {
  assertSameOrigin(event);
  assertRateLimit(event, 'site-password', 8, 15 * 60 * 1000);

  const body = await readBody<{ password?: unknown }>(event);
  const password = typeof body?.password === 'string' ? body.password : '';
  if (!password || password.length > 256) {
    throw createError({
      statusCode: 400,
      statusMessage: 'A valid password is required.',
    });
  }

  const config = useRuntimeConfig(event);
  const hash = config.sitePasswordHash;
  if (!hash) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Site access is not configured.',
    });
  }

  const isValid = await verifyPassword(hash, password);

  if (isValid) {
    await setUserSession(event, {
      siteAuthenticated: true,
    });
    return { success: true };
  }

  throw createError({
    statusCode: 401,
    statusMessage: 'Invalid password.',
  });
});
