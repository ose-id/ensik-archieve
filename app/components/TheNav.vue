<script setup lang="ts">
const { loggedIn, user, clear, fetch } = await useUserSession();

if (process.client) {
  await fetch();
}
const showDropdown = ref(false);

const dropdownItems = [
  { label: 'Log out', icon: 'i-mingcute:power-line', action: clear, danger: true },
];

function toggleDropdown() {
  showDropdown.value = !showDropdown.value;
}

onClickOutside(ref(null), () => {
  showDropdown.value = false;
});

const avatarUrl = computed(() => {
  const u = user.value as { discordId?: string; avatar?: string };
  if (!u?.discordId || !u?.avatar)
    return '/default-avatar.png';
  return `https://cdn.discordapp.com/avatars/${u.discordId}/${u.avatar}.png`;
});

const username = computed(() => {
  const u = user.value as { username?: string };
  return u?.username ?? 'Guest';
});
</script>

<template>
  <nav fixed right-0 top-0 z-40 h-16 w-full bg-white px-4 dark:bg-black class="md:w-[calc(100%-135px)] md:px-6">
    <div class="h-full flex justify-end gap-4 md:!flexbetween">
      <h1 class="hidden text-xl text-neutral-900 font-melody md:block md:text-4xl dark:text-zinc-300">
        Ensik Archieve
      </h1>

      <div
        v-if="loggedIn"
        class="flex items-center gap-4"
      >
        <!-- Profile Dropdown -->
        <div relative>
          <button flex cursor-pointer items-center gap-2 rounded-full border-none bg-transparent py-2 @click="toggleDropdown">
            <NuxtImg :src="avatarUrl" alt="img" size-8 rounded-full object-cover />
            <div i-mingcute:down-line text-xl hover:text-neutral-500 />
          </button>

          <!-- Dropdown Menu -->
          <div v-if="showDropdown" absolute right-0.5rem mt-2 w-60 overflow-hidden rounded-lg bg-white shadow-xl md:w-72 dark:bg-neutral-900>
            <!-- User Info -->
            <div flexcenter gap-3 border-b border-neutral-100 px-4 py-6 text-sm dark:border-neutral-800 md:text-base>
              <NuxtImg :src="avatarUrl" alt="img" size-8 rounded-full object-cover />
              {{ username }}
            </div>

            <!-- Menu Items -->
            <div>
              <button
                v-for="item in dropdownItems" :key="item.label" :class="item.danger ? 'text-red' : ''" aria-label="Logout" w-full
                flexcenter cursor-pointer gap-2 border-none p-2 dark:bg-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-600 @click="item.action"
              >
                <div class="text-xl text-red" :class="[item.icon]" />
                {{ item.label }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <NuxtLink v-else to="/auth/discord" my-3 flex items-center gap-2 rounded-full bg-indigo-500 px-4 py-2 text-white transition-colors hover:bg-indigo-600>
        <div i-mingcute:discord-line text-xl />
        <span text-sm>Sign In</span>
      </NuxtLink>
    </div>
  </nav>
</template>
