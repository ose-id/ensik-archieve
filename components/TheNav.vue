<script setup lang="ts">
const { loggedIn, user, clear } = useUserSession();
const showDropdown = ref(false);

const dropdownItems = [
  { label: 'Log out', icon: 'i-mingcute:power-line', action: clear, danger: true },
];

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value;
};

onClickOutside(ref(null), () => {
  showDropdown.value = false;
});

const avatarUrl = computed(() => {
  const u = user.value as { discordId?: string; avatar?: string };
  if (!u?.discordId || !u?.avatar) return '/default-avatar.png';
  return `https://cdn.discordapp.com/avatars/${u.discordId}/${u.avatar}.png`;
});
</script>

<template>
  <nav class="fixed bg-white dark:bg-black top-0 right-0 h-16 flex items-center justify-end z-40 w-full md:w-[calc(100%-80px)] px-6">
    <div
      v-if="loggedIn"
      class="flex items-center gap-4"
    >
      <!-- Profile Dropdown -->
      <div class="relative">
        <button
          class="flex items-center gap-2 py-2 bg-transparent border-none rounded-full cursor-pointer"
          @click="toggleDropdown"
        >
          <img
            :src="avatarUrl"
            alt="img"
            class="w-8 h-8 rounded-full object-cover"
          >
          <div class="i-mingcute:down-line text-xl hover:text-gray-500" />
        </button>

        <!-- Dropdown Menu -->
        <div
          v-if="showDropdown"
          class="absolute right-0.5rem mt-2 w-60 md:w-72 bg-white dark:bg-gray-900 rounded-lg shadow-xl overflow-hidden"
        >
          <!-- User Info -->
          <div class="flexcenter gap-3 px-4 py-6 border-b border-gray-100 dark:border-gray-800 text-sm md:text-base">
            <img
              :src="avatarUrl"
              alt="img"
              class="w-8 h-8 rounded-full object-cover"
            >
            {{ user.username }}
          </div>

          <!-- Menu Items -->
          <div>
            <button
              v-for="item in dropdownItems"
              :key="item.label"
              class="w-full flexcenter cursor-pointer border-none gap-2 p-2 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600"
              :class="item.danger ? 'text-red' : ''"
              aria-label="Logout"
              @click="item.action"
            >
              <div :class="[item.icon, 'text-xl text-red']" />
              {{ item.label }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-else>
      <NuxtLink
        external
        to="/auth/discord"
        class="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 transition-colors"
      >
        <div class="i-mingcute:discord-line text-xl" />
        <span class="text-sm">Sign In</span>
      </NuxtLink>
    </div>
  </nav>
</template>
