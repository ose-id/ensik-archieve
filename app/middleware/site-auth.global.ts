export default defineNuxtRouteMiddleware(async (to) => {
  // Skip middleware for login page to prevent redirect loop
  if (to.path === '/login') {
    return;
  }

  const { session } = useUserSession();

  // Check if user has authenticated with site password
  if (!session.value?.siteAuthenticated) {
    return navigateTo('/login');
  }
});
