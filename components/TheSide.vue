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
  <aside class="fixed z-50 min-h-screen w-12 border-r-1 border-transparent border-r-solid bg-white shadow-lg md:w-20 dark:border-gray-800/70 dark:bg-gray-950">
    <div flex flex-col h-dvh>
      <div flexcenter px-4 py-6>
        <NuxtImg src="/img/logo.jpg" alt="Logo" size-6 rounded-full md:size-8 />
      </div>

      <!-- Navigation Menu -->
      <nav flex-grow>
        <ul p-2 space-y-6>
          <li v-for="item in menuItems" :key="item.label">
            <NuxtLink :to="item.route" flexcenter rounded-lg p-2 transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-800>
              <div text-2xl :class="[item.icon]" />
            </NuxtLink>
          </li>
        </ul>
      </nav>

      <div flexcenter px-4 py-6>
        <ColorMode />
      </div>
    </div>
  </aside>
</template>
