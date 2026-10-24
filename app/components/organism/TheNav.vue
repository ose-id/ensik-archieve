<script setup vapor lang="ts">
const { avatarUrl, loggedIn, logout, username } = useArchiveAccount();
const showDropdown = ref(false);
const dropdown = ref<HTMLElement>();

function toggleDropdown() {
  showDropdown.value = !showDropdown.value;
}

onClickOutside(dropdown, () => {
  showDropdown.value = false;
});

async function handleLogout() {
  showDropdown.value = false;
  await logout();
}
</script>

<template>
  <nav
    class="border-b border-neutral-200/50 bg-white h-16 w-full right-0 top-0 fixed z-40 dark:(border-neutral-800/50 bg-black) md:w-[calc(100%-80px)]"
  >
    <div class="px-2 flex gap-2 h-full min-w-0 items-center justify-between md:px-4">
      <h1 class="text-xl text-neutral-900 font-bold font-melody min-w-0 whitespace-nowrap truncate lg:text-3xl md:text-2xl xl:text-4xl dark:text-zinc-100">
        Ensik Archive
      </h1>

      <!-- On mobile the account menu and sign-in live in the bottom nav's Profil sheet. -->
      <div
        v-if="loggedIn"
        class="shrink-0 gap-4 hidden items-center md:flex"
      >
        <div ref="dropdown" class="relative">
          <button
            class="py-1 pl-1 pr-2 rounded-full bg-neutral-100/50 flex gap-2 cursor-pointer transition-colors items-center dark:(bg-neutral-800/50 hover:bg-neutral-800) hover:bg-neutral-100"
            type="button"
            aria-haspopup="menu"
            :aria-expanded="showDropdown"
            @click="toggleDropdown"
          >
            <NuxtImg
              v-if="avatarUrl"
              :src="avatarUrl"
              :alt="`Avatar ${username}`"
              width="32"
              height="32"
              densities="1x 2x"
              format="webp"
              class="rounded-full h-8 w-8 object-cover"
            />
            <span
              v-else
              class="text-neutral-500 rounded-full bg-neutral-200 flex h-8 w-8 items-center justify-center dark:text-neutral-300 dark:bg-neutral-700"
              aria-hidden="true"
            >
              <span class="i-mingcute:user-3-line text-lg" />
            </span>
            <div class="text-sm text-neutral-700 font-medium max-w-40 truncate dark:text-neutral-200">
              {{ username }}
            </div>
            <span class="i-mingcute:down-line text-lg text-neutral-500" aria-hidden="true" />
          </button>

          <div
            v-if="showDropdown"
            class="mt-2 border border-neutral-100 rounded-xl bg-white max-w-[calc(100vw-1rem)] w-56 shadow-xl right-0 absolute overflow-hidden dark:border-neutral-800 dark:bg-neutral-900"
            role="menu"
          >
            <div class="p-1">
              <button
                class="text-sm text-red-500 p-2 rounded-lg flex gap-2 w-full cursor-pointer transition-colors items-center hover:bg-red-50 dark:hover:bg-red-900/20"
                type="button"
                role="menuitem"
                @click="handleLogout"
              >
                <span class="i-mingcute:power-line text-lg" aria-hidden="true" />
                Log out
              </button>
            </div>
          </div>
        </div>
      </div>

      <NuxtLink
        v-else
        to="/auth/discord"
        external
        class="text-white px-5 py-2.5 rounded-full bg-indigo-600 gap-2 hidden shadow-indigo-500/20 shadow-lg transition-[background-color,box-shadow] items-center hover:(bg-indigo-700 shadow-indigo-500/30) md:flex"
      >
        <span class="i-mingcute:discord-line text-xl" aria-hidden="true" />
        <span class="text-sm font-medium">Sign In</span>
      </NuxtLink>
    </div>
  </nav>
</template>
