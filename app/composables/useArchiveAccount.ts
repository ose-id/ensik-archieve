export function useArchiveAccount() {
  const { clear, loggedIn, user } = useUserSession();

  /** Discord avatar URL, or `undefined` when the user has no custom avatar. */
  const avatarUrl = computed(() => {
    if (!user.value?.discordId || !user.value.avatar)
      return undefined;
    return `https://cdn.discordapp.com/avatars/${user.value.discordId}/${user.value.avatar}.png`;
  });

  const username = computed(() => user.value?.username ?? 'Guest');

  /** Mobile account sheet (theme, log out). Opened from the bottom nav or the profile header. */
  const accountSheetOpen = useState('archive:account-sheet-open', () => false);

  async function logout() {
    accountSheetOpen.value = false;
    await clear();
    await navigateTo('/login');
  }

  return {
    accountSheetOpen,
    avatarUrl,
    loggedIn,
    logout,
    username,
  };
}
