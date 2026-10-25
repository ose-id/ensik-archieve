<script setup vapor lang="ts">
/** Minimum scroll distance before the bar reacts, so small jitters don't toggle it. */
const SCROLL_THRESHOLD = 8;
/** The bar always stays visible within this distance from the top of the page. */
const HIDE_AFTER = 96;

const route = useRoute();
const { accountSheetOpen: showAccount, avatarUrl, loggedIn, logout, username } = useArchiveAccount();
const uploadInputId = ARCHIVE_UPLOAD_INPUT_ID;
const { isDarkMode, isTransitioning, toggleColorMode } = useAnimatedColorMode();
const { y: scrollY } = useWindowScroll();
const scrolledAway = ref(false);
let lastScrollY = 0;

const isHome = computed(() => route.path === '/');
const isAccountActive = computed(() => showAccount.value || route.path === '/profile');
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

/** Keyboard activation for the upload label (taps go through the label itself). */
function openUploadPicker() {
  document.getElementById(uploadInputId)?.click();
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
    class="pb-[env(safe-area-inset-bottom)] border-t border-neutral-200 bg-white/95 transition-transform duration-300 ease-out inset-x-0 bottom-0 fixed z-50 backdrop-blur-sm dark:border-neutral-800/70 dark:bg-neutral-950/95 md:hidden"
    :class="isHidden ? 'translate-y-full' : 'translate-y-0'"
    :inert="isHidden"
  >
    <div class="grid grid-cols-3 h-16 items-center">
      <NuxtLink
        to="/"
        class="group nav-tab"
        :class="isHome ? 'text-blue-600 dark:text-blue-400' : 'text-muted'"
        :aria-current="isHome ? 'page' : undefined"
      >
        <span
          class="nav-pill"
          :class="isHome ? 'bg-blue-100 dark:bg-blue-500/15' : ''"
        >
          <span
            class="size-5.5"
            :class="isHome ? 'i-mingcute:home-4-fill' : 'i-mingcute:home-4-line'"
            aria-hidden="true"
          />
        </span>
        Beranda
      </NuxtLink>

      <!-- The center slot is always the main action: upload when signed in, sign-in otherwise. -->
      <!-- Anchored to the bottom so the raised button overflows upward without stretching the bar. -->
      <div class="h-full relative">
        <div class="flex flex-col items-center bottom-2 left-1/2 absolute -translate-x-1/2">
          <!-- A label for the shared file input opens the native photo picker directly from the tap. -->
          <label
            v-if="loggedIn"
            :for="uploadInputId"
            role="button"
            tabindex="0"
            class="group text-2xs text-muted font-medium flex flex-col gap-1 cursor-pointer select-none items-center"
            @keydown.enter.prevent="openUploadPicker"
            @keydown.space.prevent="openUploadPicker"
          >
            <span class="nav-fab bg-blue-600 shadow-blue-600/30 group-hover:bg-blue-700">
              <span class="i-mingcute:add-line size-6.5" aria-hidden="true" />
            </span>
            Upload
          </label>
          <NuxtLink
            v-else
            to="/auth/discord"
            external
            class="group text-2xs text-indigo-600 font-medium flex flex-col gap-1 select-none items-center dark:text-indigo-400"
          >
            <span class="nav-fab bg-indigo-600 shadow-indigo-600/30 group-hover:bg-indigo-700">
              <span class="i-mingcute:discord-fill size-6.5" aria-hidden="true" />
            </span>
            Masuk
          </NuxtLink>
        </div>
      </div>

      <!-- Signed in, Profil opens the profile page (settings live behind its gear); guests get the account sheet. -->
      <NuxtLink
        v-if="loggedIn"
        to="/profile"
        class="group nav-tab"
        :class="isAccountActive ? 'text-blue-600 dark:text-blue-400' : 'text-muted'"
        :aria-current="route.path === '/profile' ? 'page' : undefined"
      >
        <span
          class="nav-pill"
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
            class="rounded-full h-6 w-6 object-cover"
            :class="isAccountActive ? 'ring-2 ring-blue-600 dark:ring-blue-400' : ''"
          />
          <span
            v-else
            class="size-5.5"
            :class="isAccountActive ? 'i-mingcute:user-3-fill' : 'i-mingcute:user-3-line'"
            aria-hidden="true"
          />
        </span>
        Profil
      </NuxtLink>
      <button
        v-else
        type="button"
        class="group nav-tab"
        :class="isAccountActive ? 'text-blue-600 dark:text-blue-400' : 'text-muted'"
        aria-haspopup="dialog"
        :aria-expanded="showAccount"
        @click="openAccount"
      >
        <span
          class="nav-pill"
          :class="isAccountActive ? 'bg-blue-100 dark:bg-blue-500/15' : ''"
        >
          <span
            class="size-5.5"
            :class="isAccountActive ? 'i-mingcute:user-3-fill' : 'i-mingcute:user-3-line'"
            aria-hidden="true"
          />
        </span>
        Akun
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
      class="bg-black/50 inset-0 fixed z-[60] overflow-x-hidden md:hidden"
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
          class="px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 rounded-t-3xl bg-white max-w-full shadow-2xl inset-x-0 bottom-0 absolute dark:bg-neutral-900"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-account-title"
        >
          <div class="mx-auto mb-4 rounded-full bg-neutral-300 h-1.5 w-10 dark:bg-neutral-700" aria-hidden="true" />

          <header class="mb-3 px-1 flex gap-3 items-center">
            <NuxtImg
              v-if="avatarUrl"
              :src="avatarUrl"
              alt=""
              width="48"
              height="48"
              densities="1x 2x"
              format="webp"
              class="rounded-full shrink-0 h-12 w-12 object-cover"
            />
            <span
              v-else
              class="text-neutral-500 rounded-full bg-neutral-100 flex shrink-0 h-12 w-12 items-center justify-center dark:text-neutral-400 dark:bg-neutral-800"
              aria-hidden="true"
            >
              <span class="i-mingcute:user-3-line text-2xl" />
            </span>
            <div class="flex-1 min-w-0">
              <h2 id="mobile-account-title" class="text-base text-strong font-semibold truncate">
                {{ loggedIn ? username : 'Belum masuk' }}
              </h2>
              <p class="text-xs text-muted">
                {{ loggedIn ? 'Anggota Ensik' : 'Masuk untuk mengunggah foto' }}
              </p>
            </div>
            <button
              type="button"
              class="icon-btn h-10 w-10"
              aria-label="Tutup"
              @click="closeAccount"
            >
              <span class="i-mingcute:close-line text-2xl" aria-hidden="true" />
            </button>
          </header>

          <div class="flex flex-col gap-1">
            <div class="text-sm text-strong font-medium px-3 rounded-xl flex gap-3 min-h-12 items-center">
              <span
                class="text-xl text-muted"
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
                class="rounded-full shrink-0 h-7 w-12 cursor-pointer transition-colors duration-200 relative"
                :class="isDarkMode ? 'bg-blue-600' : 'bg-neutral-200'"
                @click="toggleColorMode"
              >
                <span
                  class="rounded-full bg-white h-5 w-5 shadow-sm transition-transform duration-300 left-1 top-1 absolute"
                  :class="isDarkMode ? 'translate-x-5' : 'translate-x-0'"
                />
              </button>
            </div>

            <button
              v-if="loggedIn"
              type="button"
              class="text-sm text-red-600 font-medium px-3 text-left rounded-xl flex gap-3 min-h-12 cursor-pointer items-center dark:text-red-400 active:bg-red-50 dark:active:bg-red-950/40"
              @click="handleLogout"
            >
              <span class="i-mingcute:power-line text-xl" aria-hidden="true" />
              Keluar
            </button>

            <NuxtLink
              v-else
              to="/auth/discord"
              external
              class="text-sm text-white font-medium mt-2 px-4 rounded-xl bg-indigo-600 flex gap-2 min-h-12 items-center justify-center active:bg-indigo-700"
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
