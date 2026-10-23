<script setup vapor lang="ts">
/** Minimum scroll distance before the bar reacts, so small jitters don't toggle it. */
const SCROLL_THRESHOLD = 8;
/** The bar always stays visible within this distance from the top of the page. */
const HIDE_AFTER = 96;

const route = useRoute();
const { avatarUrl, loggedIn, logout, username } = useArchiveAccount();
const { requestUpload } = useArchiveEvents();
const { isDarkMode, isTransitioning, toggleColorMode } = useAnimatedColorMode();
const { y: scrollY } = useWindowScroll();
const showAccount = ref(false);
const scrolledAway = ref(false);
let lastScrollY = 0;

const isHome = computed(() => route.path === '/');
const isAccountActive = computed(() => showAccount.value || route.path.startsWith('/dashboard'));
// Only the gallery is long enough for the bar to get in the way of content.
const isHidden = computed(() => isHome.value && scrolledAway.value && !showAccount.value);

watch(scrollY, (value) => {
  const delta = value - lastScrollY;
  if (Math.abs(delta) < SCROLL_THRESHOLD)
    return;

  scrolledAway.value = delta > 0 && value > HIDE_AFTER;
  lastScrollY = value;
});

watch(() => route.path, () => {
  showAccount.value = false;
  scrolledAway.value = false;
  lastScrollY = scrollY.value;
});

onKeyStroke('Escape', closeAccount);

function openAccount() {
  showAccount.value = true;
}

function closeAccount() {
  showAccount.value = false;
}

async function handleLogout() {
  closeAccount();
  await logout();
}
</script>

<template>
  <nav
    aria-label="Navigasi utama"
    class="fixed inset-x-0 bottom-0 z-50 box-border border-t border-neutral-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur transition-transform duration-300 ease-out md:hidden dark:border-neutral-800/70 dark:bg-neutral-950/95"
    :class="isHidden ? 'translate-y-full' : 'translate-y-0'"
    :inert="isHidden"
  >
    <div class="grid grid-cols-3 h-16 items-center">
      <NuxtLink
        to="/"
        class="group [-webkit-tap-highlight-color:transparent] h-full flex flex-col select-none items-center justify-center gap-1 text-[11px] font-medium"
        :class="isHome ? '!text-blue-600 dark:!text-blue-400' : '!text-neutral-500 dark:!text-neutral-400'"
        :aria-current="isHome ? 'page' : undefined"
      >
        <span
          class="h-8 w-14 flex items-center justify-center rounded-full transition-[background-color,transform] duration-200 group-active:scale-90"
          :class="isHome ? 'bg-blue-100 dark:bg-blue-500/15' : ''"
        >
          <span
            class="text-[22px]"
            :class="isHome ? 'i-mingcute:home-6-fill' : 'i-mingcute:home-6-line'"
            aria-hidden="true"
          />
        </span>
        Beranda
      </NuxtLink>

      <div class="flex justify-center">
        <button
          v-if="loggedIn"
          type="button"
          class="[-webkit-tap-highlight-color:transparent] h-14 w-14 flex cursor-pointer items-center justify-center border-0 rounded-full bg-blue-600 text-white shadow-blue-600/30 shadow-lg ring-4 ring-white transition-[background-color,transform] duration-200 -mt-7 active:scale-90 hover:bg-blue-700 dark:ring-neutral-950"
          aria-label="Upload gambar"
          @click="requestUpload"
        >
          <span class="i-mingcute:add-line text-[26px]" aria-hidden="true" />
        </button>
      </div>

      <button
        type="button"
        class="group [-webkit-tap-highlight-color:transparent] h-full flex flex-col cursor-pointer select-none items-center justify-center gap-1 border-0 bg-transparent p-0 text-[11px] font-medium"
        :class="isAccountActive ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-500 dark:text-neutral-400'"
        aria-haspopup="dialog"
        :aria-expanded="showAccount"
        @click="openAccount"
      >
        <span
          class="h-8 w-14 flex items-center justify-center rounded-full transition-[background-color,transform] duration-200 group-active:scale-90"
          :class="isAccountActive ? 'bg-blue-100 dark:bg-blue-500/15' : ''"
        >
          <NuxtImg
            v-if="avatarUrl"
            :src="avatarUrl"
            alt=""
            width="24"
            height="24"
            densities="1x 2x"
            format="webp"
            class="h-6 w-6 rounded-full object-cover"
            :class="isAccountActive ? 'ring-2 ring-blue-600 dark:ring-blue-400' : ''"
          />
          <span
            v-else
            class="text-[22px]"
            :class="isAccountActive ? 'i-mingcute:user-3-fill' : 'i-mingcute:user-3-line'"
            aria-hidden="true"
          />
        </span>
        {{ loggedIn ? 'Profil' : 'Akun' }}
      </button>
    </div>
  </nav>

  <Transition
    enter-active-class="transition-opacity duration-200"
    enter-from-class="opacity-0"
    leave-active-class="transition-opacity duration-200"
    leave-to-class="opacity-0"
  >
    <div
      v-if="showAccount"
      class="fixed inset-0 z-[60] overflow-x-hidden bg-black/50 md:hidden"
      @click.self="closeAccount"
    >
      <Transition
        appear
        enter-active-class="transition-transform duration-300 ease-out"
        enter-from-class="translate-y-full"
        leave-active-class="transition-transform duration-200 ease-in"
        leave-to-class="translate-y-full"
      >
        <section
          v-if="showAccount"
          class="absolute inset-x-0 bottom-0 box-border max-w-full rounded-t-3xl bg-white px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 shadow-2xl dark:bg-neutral-900"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-account-title"
        >
          <div class="mx-auto mb-4 h-1.5 w-10 rounded-full bg-neutral-300 dark:bg-neutral-700" aria-hidden="true" />

          <header class="mb-3 flex items-center gap-3 px-1">
            <NuxtImg
              v-if="avatarUrl"
              :src="avatarUrl"
              alt=""
              width="48"
              height="48"
              densities="1x 2x"
              format="webp"
              class="h-12 w-12 shrink-0 rounded-full object-cover"
            />
            <span
              v-else
              class="h-12 w-12 flex shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
              aria-hidden="true"
            >
              <span class="i-mingcute:user-3-line text-2xl" />
            </span>
            <div class="min-w-0 flex-1">
              <h2 id="mobile-account-title" class="m-0 truncate text-base text-neutral-900 font-semibold dark:text-white">
                {{ loggedIn ? username : 'Belum masuk' }}
              </h2>
              <p class="m-0 text-xs text-neutral-500 dark:text-neutral-400">
                {{ loggedIn ? 'Anggota Ensik' : 'Masuk untuk mengunggah foto' }}
              </p>
            </div>
            <button
              type="button"
              class="h-10 w-10 flex shrink-0 cursor-pointer items-center justify-center border-0 rounded-full bg-transparent text-neutral-500 active:bg-neutral-100 dark:text-neutral-400 dark:active:bg-neutral-800"
              aria-label="Tutup"
              @click="closeAccount"
            >
              <span class="i-mingcute:close-line text-2xl" aria-hidden="true" />
            </button>
          </header>

          <div class="flex flex-col gap-1">
            <NuxtLink
              v-if="loggedIn"
              to="/dashboard"
              class="min-h-12 flex items-center gap-3 rounded-xl px-3 text-sm font-medium active:bg-neutral-100 dark:active:bg-neutral-800"
              @click="closeAccount"
            >
              <span class="i-mingcute:pic-line text-xl text-neutral-500 dark:text-neutral-400" aria-hidden="true" />
              <span class="flex-1">Foto saya</span>
              <span class="i-mingcute:right-line text-lg text-neutral-400" aria-hidden="true" />
            </NuxtLink>

            <div class="min-h-12 flex items-center gap-3 rounded-xl px-3 text-sm text-neutral-900 font-medium dark:text-white">
              <span
                class="text-xl text-neutral-500 dark:text-neutral-400"
                :class="isDarkMode ? 'i-mingcute:moon-stars-line' : 'i-mingcute:sun-line'"
                aria-hidden="true"
              />
              <span id="mobile-dark-mode-label" class="flex-1">Mode gelap</span>
              <button
                type="button"
                role="switch"
                aria-labelledby="mobile-dark-mode-label"
                :aria-checked="isDarkMode"
                :aria-disabled="isTransitioning"
                class="relative h-7 w-12 shrink-0 cursor-pointer rounded-full border-none transition-colors duration-200"
                :class="isDarkMode ? 'bg-blue-600' : 'bg-neutral-200'"
                @click="toggleColorMode"
              >
                <span
                  class="absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300"
                  :class="isDarkMode ? 'translate-x-5' : 'translate-x-0'"
                />
              </button>
            </div>

            <button
              v-if="loggedIn"
              type="button"
              class="min-h-12 flex cursor-pointer items-center gap-3 border-0 rounded-xl bg-transparent px-3 text-left text-sm text-red-600 font-medium active:bg-red-50 dark:text-red-400 dark:active:bg-red-950/40"
              @click="handleLogout"
            >
              <span class="i-mingcute:power-line text-xl" aria-hidden="true" />
              Keluar
            </button>

            <NuxtLink
              v-else
              to="/auth/discord"
              external
              class="mt-2 min-h-12 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-medium active:bg-indigo-700 !text-white"
            >
              <span class="i-mingcute:discord-line text-xl" aria-hidden="true" />
              Masuk dengan Discord
            </NuxtLink>
          </div>
        </section>
      </Transition>
    </div>
  </Transition>
</template>
