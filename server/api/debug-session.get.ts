export default defineEventHandler(async (event) => {
  const session = await getUserSession(event);

  return {
    hasSession: !!session,
    user: session?.user || null,
    loggedInAt: session?.loggedInAt || null,
    sessionKeys: session ? Object.keys(session) : [],
  };
});
