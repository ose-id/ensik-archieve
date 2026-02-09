export default defineNuxtRouteMiddleware(async (to) => {
  // Skip middleware for login page to prevent redirect loop
  if (to.path === '/login') {
    return;
  }

  const { session, fetch: fetchSession } = useUserSession();

  // Ensure session is fetched/refreshed (important after login redirect)
  await fetchSession();

  // Check if user has authenticated with site password
  if (!session.value?.siteAuthenticated) {
    return navigateTo('/login');
  }
});
