export default defineNuxtRouteMiddleware((to) => {
  if (to.path === '/login' || to.path.startsWith('/auth/'))
    return;

  const { loggedIn, session } = useUserSession();
  if (loggedIn.value || session.value?.siteAuthenticated)
    return;

  return navigateTo('/login');
});
