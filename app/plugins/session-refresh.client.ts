export default defineNuxtPlugin(async () => {
  const { fetch } = useUserSession();

  await fetch();
});
