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
  <nav
    fixed right-0 top-0 z-40 h-16 w-full border-b transition-all duration-300
    class="border-neutral-200/50 bg-white/80 backdrop-blur-md md:w-[calc(100%-80px)] dark:border-neutral-800/50 dark:bg-black/80"
  >
    <div h-full flex items-center justify-between px-2 md:px-4>
      <h1 text-xl text-neutral-900 font-bold font-melody lg:text-3xl md:text-2xl xl:text-4xl dark:text-zinc-100>
        Ensik Archieve
      </h1>

      <div
        v-if="loggedIn"
        flex items-center gap-3 md:gap-4
      >
        <div relative>
          <button
            flex cursor-pointer items-center gap-2 rounded-full border-none py-1 pl-1 pr-2 transition-colors
            class="bg-neutral-100/50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            @click="toggleDropdown"
          >
            <NuxtImg :src="avatarUrl" alt="img" size-8 rounded-full object-cover />
            <div hidden text-sm text-neutral-700 font-medium md:block dark:text-neutral-200>
              {{ username }}
            </div>
            <div i-mingcute:down-line text-lg text-neutral-500 />
          </button>

          <div
            v-if="showDropdown"
            absolute right-0 mt-2 w-56 overflow-hidden border border-neutral-100 rounded-xl bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-900
          >
            <div flex items-center gap-3 border-b border-neutral-100 px-4 py-4 md:hidden dark:border-neutral-800>
              <NuxtImg :src="avatarUrl" alt="img" size-10 rounded-full object-cover />
              <div flex flex-col>
                <span text-sm text-neutral-900 font-semibold dark:text-white>{{ username }}</span>
                <span text-xs text-neutral-500>User</span>
              </div>
            </div>

            <div p-1>
              <button
                v-for="item in dropdownItems"
                :key="item.label"
                w-full flex cursor-pointer items-center gap-2 rounded-lg border-none p-2 text-sm transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800
                :class="item.danger ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-neutral-700 dark:text-neutral-200'"
                @click="item.action"
              >
                <div text-lg :class="[item.icon]" />
                {{ item.label }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <NuxtLink
        v-else
        to="/auth/discord"
        external
        flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-white shadow-lg transition-all hover:bg-indigo-700
        class="shadow-indigo-500/20 hover:shadow-indigo-500/30"
      >
        <div i-mingcute:discord-line text-xl />
        <span text-sm font-medium>Sign In</span>
      </NuxtLink>
    </div>
  </nav>
</template>
