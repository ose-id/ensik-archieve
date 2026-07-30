<script setup lang="ts">
const { clear, loggedIn, user } = useUserSession();
const showDropdown = ref(false);
const dropdown = ref<HTMLElement>();

function toggleDropdown() {
  showDropdown.value = !showDropdown.value;
}

onClickOutside(dropdown, () => {
  showDropdown.value = false;
});

const avatarUrl = computed(() => {
  if (!user.value?.discordId || !user.value.avatar)
    return '/default-avatar.png';
  return `https://cdn.discordapp.com/avatars/${user.value.discordId}/${user.value.avatar}.png`;
});

const username = computed(() => user.value?.username ?? 'Guest');

async function logout() {
  showDropdown.value = false;
  await clear();
  await navigateTo('/login');
}
</script>

<template>
  <nav
    fixed right-0 top-0 z-40 h-16 w-full border-b
    class="border-neutral-200/50 bg-white md:w-[calc(100%-80px)] dark:border-neutral-800/50 dark:bg-black"
  >
    <div h-full min-w-0 flex items-center justify-between gap-2 px-2 md:px-4>
      <h1 class="min-w-0 truncate whitespace-nowrap" text-xl text-neutral-900 font-bold font-melody lg:text-3xl md:text-2xl xl:text-4xl dark:text-zinc-100>
        Ensik Archive
      </h1>

      <div
        v-if="loggedIn"
        class="flex shrink-0 items-center gap-3 md:gap-4"
      >
        <div ref="dropdown" relative>
          <button
            flex cursor-pointer items-center gap-2 rounded-full border-none py-1 pl-1 pr-2 transition-colors
            class="bg-neutral-100/50 dark:bg-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            type="button"
            aria-haspopup="menu"
            :aria-expanded="showDropdown"
            @click="toggleDropdown"
          >
            <NuxtImg
              :src="avatarUrl"
              :alt="`Avatar ${username}`"
              width="32"
              height="32"
              densities="1x 2x"
              format="webp"
              rounded-full
              object-cover
            />
            <div class="max-w-40 truncate" hidden text-sm text-neutral-700 font-medium md:block dark:text-neutral-200>
              {{ username }}
            </div>
            <span i-mingcute:down-line text-lg text-neutral-500 aria-hidden="true" />
          </button>

          <div
            v-if="showDropdown"
            class="absolute right-0 mt-2 max-w-[calc(100vw-1rem)] w-56 overflow-hidden border border-neutral-100 rounded-xl bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
            role="menu"
          >
            <div class="min-w-0" flex items-center gap-3 border-b border-neutral-100 px-4 py-4 md:hidden dark:border-neutral-800>
              <NuxtImg
                :src="avatarUrl"
                alt=""
                width="40"
                height="40"
                densities="1x 2x"
                format="webp"
                class="shrink-0"
                rounded-full
                object-cover
              />
              <div class="min-w-0 flex-1" flex flex-col>
                <span class="block truncate" :title="username" text-sm text-neutral-900 font-semibold dark:text-white>
                  {{ username }}
                </span>
                <span text-xs text-neutral-500>User</span>
              </div>
            </div>

            <div p-1>
              <button
                w-full flex cursor-pointer items-center gap-2 rounded-lg border-none p-2 text-sm transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800
                class="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                type="button"
                role="menuitem"
                @click="logout"
              >
                <span i-mingcute:power-line text-lg aria-hidden="true" />
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
        flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-white shadow-lg transition-[background-color,box-shadow] hover:bg-indigo-700
        class="shadow-indigo-500/20 hover:shadow-indigo-500/30"
      >
        <span i-mingcute:discord-line text-xl aria-hidden="true" />
        <span text-sm font-medium>Sign In</span>
      </NuxtLink>
    </div>
  </nav>
</template>
