export default defineNuxtRouteMiddleware((to) => {
  // Skip middleware for login page and auth callback routes
  if (to.path === '/login' || to.path.startsWith('/auth/')) {
    return;
  }

  const { loggedIn, session } = useUserSession();

  // Allow access if user is logged in via OAuth (Discord) OR via site password
  if (loggedIn.value || session.value?.siteAuthenticated) {
    return;
  }

  return navigateTo('/login');
});
