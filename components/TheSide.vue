<script setup lang="ts">
interface MenuItem {
  icon: string;
  label: string;
  route: string;
}

const menuItems: MenuItem[] = [
  { icon: 'i-mingcute:home-6-line', label: 'Home', route: '/' },
];
</script>

<template>
  <aside
    class="w-12 md:w-20 fixed left-0 top-0 h-full bg-white dark:bg-gray-950 shadow-lg z-50 border-r-solid border-r-1 border-transparent dark:border-gray-800/70"
  >
    <div class="flex flex-col h-full">
      <!-- Logo -->
      <div class="px-4 py-6 flexcenter">
        <img
          src="/img/logo.jpg"
          alt="Logo"
          class="size-6 md:size-8 rounded-full"
        >
      </div>

      <!-- Navigation Menu -->
      <nav class="flex-grow">
        <ul class="space-y-6 p-2">
          <li
            v-for="item in menuItems"
            :key="item.label"
          >
            <NuxtLink
              :to="item.route"
              class="flexcenter p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
            >
              <div :class="[item.icon, 'text-2xl']" />
            </NuxtLink>
          </li>
        </ul>
      </nav>

      <div class="px-4 py-6 flexcenter">
        <ColorMode />
      </div>
    </div>
  </aside>
</template>
