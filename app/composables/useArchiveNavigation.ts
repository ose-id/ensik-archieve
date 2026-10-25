// @unocss-include -- the icon classes below are only referenced from this file.
interface ArchiveNavigationItem {
  active: boolean;
  /** Outline icon, shown while the page is not active. */
  icon: string;
  /** Filled icon, shown once the page is active. */
  activeIcon: string;
  label: string;
  route: string;
}

export function useArchiveNavigation() {
  const { loggedIn } = useUserSession();
  const route = useRoute();
  const menuItems = computed<ArchiveNavigationItem[]>(() => {
    const path = route.path;
    return [
      {
        active: path === '/',
        icon: 'i-mingcute:home-4-line',
        activeIcon: 'i-mingcute:home-4-fill',
        label: 'Beranda',
        route: '/',
      },
      ...(loggedIn.value
        ? [
            {
              active: path === '/profile',
              icon: 'i-mingcute:user-3-line',
              activeIcon: 'i-mingcute:user-3-fill',
              label: 'Profil',
              route: '/profile',
            },
          ]
        : []),
    ];
  });

  return {
    loggedIn,
    menuItems,
  };
}
