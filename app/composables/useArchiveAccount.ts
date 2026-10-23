export function useArchiveAccount() {
  const { clear, loggedIn, user } = useUserSession();

  /** Discord avatar URL, or `undefined` when the user has no custom avatar. */
  const avatarUrl = computed(() => {
    if (!user.value?.discordId || !user.value.avatar)
      return undefined;
    return `https://cdn.discordapp.com/avatars/${user.value.discordId}/${user.value.avatar}.png`;
  });

  const username = computed(() => user.value?.username ?? 'Guest');

  async function logout() {
    await clear();
    await navigateTo('/login');
  }

  return {
    avatarUrl,
    loggedIn,
    logout,
    username,
  };
}
