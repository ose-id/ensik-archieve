<script setup lang="ts">
interface MenuItem {
  icon: string;
  label: string;
  route: string;
}

const { loggedIn, fetch } = await useUserSession();
const route = useRoute();

if (import.meta.client) {
  await fetch();
}

const menuItems = computed<MenuItem[]>(() => [
  { icon: 'i-mingcute:home-6-line', label: 'Home', route: '/' },
  ...(loggedIn.value
    ? [
        { icon: 'i-mingcute:dashboard-line', label: 'Dashboard', route: '/dashboard' },
      ]
    : []),
]);

const currentPath = computed(() => route.path);

function isActive(path: string) {
  if (path === '/')
    return currentPath.value === '/';

  return currentPath.value === path || currentPath.value.startsWith(`${path}/`);
}
</script>

<template>
  <nav class="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-neutral-200 bg-white px-4 py-2 md:hidden dark:border-neutral-800/70 dark:bg-neutral-950">
    <NuxtLink
      v-for="item in menuItems"
      :key="item.label"
      :to="item.route"
      class="flexcenter flex-col gap-1 rounded-lg px-3 py-1 text-xs transition-colors duration-200"
      :class="[
        isActive(item.route)
          ? 'text-blue-600 dark:text-blue-400'
          : 'text-neutral-500 dark:text-neutral-400',
      ]"
    >
      <div
        class="text-xl transition-colors"
        :class="[
          item.icon,
          isActive(item.route)
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-neutral-500 dark:text-neutral-400',
        ]"
      />
      <span>{{ item.label }}</span>
    </NuxtLink>
  </nav>
</template>
