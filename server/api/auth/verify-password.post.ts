export default defineEventHandler(async (event) => {
  const { password } = await readBody(event);
  const config = useRuntimeConfig();

  if (password === config.sitePassword) {
    const session = await getUserSession(event);
    await setUserSession(event, {
      ...session,
      siteAuthenticated: true,
    });
    return { success: true };
  }

  throw createError({
    statusCode: 401,
    statusMessage: 'Invalid password',
  });
});
