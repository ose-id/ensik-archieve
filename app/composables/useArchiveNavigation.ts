interface ArchiveNavigationItem {
  active: boolean;
  icon: string;
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
        icon: 'i-mingcute:home-6-line',
        label: 'Home',
        route: '/',
      },
      ...(loggedIn.value
        ? [{
            active: path === '/dashboard' || path.startsWith('/dashboard/'),
            icon: 'i-mingcute:dashboard-line',
            label: 'Dashboard',
            route: '/dashboard',
          }]
        : []),
    ];
  });

  return {
    loggedIn,
    menuItems,
  };
}
