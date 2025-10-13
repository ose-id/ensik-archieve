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

const showSettings = ref(false);
const showNav = ref(false);
const colorMode = useColorMode();
const isDarkMode = computed(() => colorMode.value === 'dark');

function openSettings() {
  showSettings.value = true;
}

function closeSettings() {
  showSettings.value = false;
}

function toggleDarkMode() {
  colorMode.preference = isDarkMode.value ? 'light' : 'dark';
}

onMounted(() => {
  showNav.value = true;
});
</script>

<template>
  <nav
    class="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-neutral-200 bg-white px-4 py-2 transition-transform duration-300 md:hidden dark:border-neutral-800/70 dark:bg-neutral-950"
    :class="showNav ? 'translate-y-0' : 'translate-y-full'"
  >
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

    <button
      class="flexcenter flex-col gap-1 border-0 rounded-lg bg-transparent px-3 py-1 text-xs transition-colors duration-200"
      :class="showSettings ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-500 dark:text-neutral-400'"
      type="button"
      aria-haspopup="dialog"
      :aria-expanded="showSettings"
      @click="openSettings"
    >
      <div
        class="text-xl transition-colors"
        :class="showSettings ? 'i-mingcute:settings-3-line text-blue-600 dark:text-blue-400' : 'i-mingcute:settings-3-line text-neutral-500 dark:text-neutral-400'"
      />
      <span>Settings</span>
    </button>
  </nav>

  <div
    v-if="showSettings"
    class="fixed inset-0 z-50 flex items-end justify-center bg-black/50 md:hidden"
    @click.self="closeSettings"
  >
    <div
      w-full
      rounded-t-2xl
      bg-white
      p-4
      shadow-lg
      dark:bg-neutral-900
      role="dialog"
      aria-modal="true"
      aria-labelledby="mobile-settings-title"
    >
      <div mb-4 flex items-center justify-between>
        <h2 id="mobile-settings-title" text-base text-neutral-900 font-semibold dark:text-white>
          Settings
        </h2>
        <button
          class="i-mingcute:close-line text-2xl text-neutral-500"
          type="button"
          aria-label="Close settings"
          @click="closeSettings"
        />
      </div>
      <div flex items-center justify-between>
        <span text-sm text-neutral-700 dark:text-neutral-300>Dark Mode</span>
        <button
          type="button"
          role="switch"
          :aria-checked="isDarkMode"
          class="relative h-7 w-12 cursor-pointer rounded-full border-none bg-neutral-200 transition-colors duration-200 dark:bg-neutral-700"
          :class="isDarkMode ? 'bg-neutral-900 dark:bg-neutral-600' : ''"
          @click="toggleDarkMode"
        >
          <span
            class="absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200"
            :class="isDarkMode ? 'translate-x-5' : 'translate-x-0'"
          />
        </button>
      </div>
    </div>
  </div>
</template>
