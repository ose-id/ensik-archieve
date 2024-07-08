export default defineNuxtRouteMiddleware(async (to, _from) => {
  const session = await useUserSession();

  const protectedRoutes = ['/'];

  if (!session?.user && protectedRoutes.includes(to.path)) {
    return navigateTo('/auth/discord');
  }
});
