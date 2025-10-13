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
  <aside class="fixed left-0 z-50 hidden flex-col border-r-1 border-transparent border-r-solid bg-white shadow-lg md:min-h-screen md:w-20 md:flex dark:border-neutral-800/70 dark:bg-neutral-950">
    <div flexcenter px-4 py-6>
      <NuxtImg src="/img/logo.jpg" alt="Logo" size-6 rounded-full md:size-8 />
    </div>

    <!-- Navigation Menu -->
    <nav flex-grow>
      <ul list-none p-4 space-y-6>
        <li v-for="item in menuItems" :key="item.label">
          <NuxtLink
            :to="item.route"
            class="flexcenter rounded-lg p-2 transition-colors duration-200"
            :class="[
              isActive(item.route)
                ? 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white'
                : 'hover:bg-neutral-100 text-neutral-500 dark:text-neutral-400 dark:hover:bg-neutral-800',
            ]"
          >
            <div
              class="text-2xl transition-colors"
              :class="[
                item.icon,
                isActive(item.route) ? 'text-blue-500 dark:text-blue-400' : '',
              ]"
            />
          </NuxtLink>
        </li>
      </ul>
    </nav>

    <div flexcenter px-4 py-6>
      <ColorMode />
    </div>
  </aside>
</template>
