<script setup lang="ts">
interface MenuItem {
  icon: string;
  label: string;
  route: string;
}

const { loggedIn } = useUserSession();

const menuItems = computed<MenuItem[]>(() => [
  { icon: 'i-mingcute:home-6-line', label: 'Home', route: '/' },
  ...(loggedIn.value
    ? [
        { icon: 'i-mingcute:dashboard-line', label: 'Dashboard', route: '/dashboard' },
      ]
    : []),
]);
</script>

<template>
  <aside class="fixed left-0 z-50 min-h-screen w-12 flex flex-col border-r-1 border-transparent border-r-solid bg-white shadow-lg md:w-20 dark:border-neutral-800/70 dark:bg-neutral-950">
    <div flexcenter px-4 py-6>
      <NuxtImg src="/img/logo.jpg" alt="Logo" size-6 rounded-full md:size-8 />
    </div>

    <!-- Navigation Menu -->
    <nav flex-grow>
      <ul p-2 space-y-6>
        <li v-for="item in menuItems" :key="item.label">
          <NuxtLink :to="item.route" flexcenter rounded-lg p-2 transition-colors duration-200 hover:bg-neutral-100 dark:hover:bg-neutral-800>
            <div text-2xl :class="[item.icon]" />
          </NuxtLink>
        </li>
      </ul>
    </nav>

    <div flexcenter px-4 py-6>
      <ColorMode />
    </div>
  </aside>
</template>
