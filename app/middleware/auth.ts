export default defineNuxtRouteMiddleware(async (to, _from) => {
  const { loggedIn } = await useUserSession();

  console.warn('Auth middleware - Path:', to.path, 'LoggedIn value:', loggedIn.value);

  if (to.path === '/dashboard' && !loggedIn.value) {
    console.warn('Redirecting from dashboard to home - not logged in');
    return navigateTo('/');
  }
});
