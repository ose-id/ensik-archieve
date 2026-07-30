<script setup lang="ts">
const { loggedIn, menuItems } = useArchiveNavigation();
const { requestUpload } = useArchiveEvents();
const showSettings = ref(false);
const { isDarkMode, isTransitioning, toggleColorMode } = useAnimatedColorMode();

function openSettings() {
  showSettings.value = true;
}

function closeSettings() {
  showSettings.value = false;
}
</script>

<template>
  <nav
    class="fixed inset-x-0 bottom-0 z-50 box-border flex items-center justify-around border-t border-neutral-200 bg-white px-4 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 md:hidden dark:border-neutral-800/70 dark:bg-neutral-950"
  >
    <NuxtLink
      v-for="item in menuItems"
      :key="item.route"
      :to="item.route"
      class="flexcenter flex-col gap-1 rounded-lg px-3 py-1 text-xs transition-colors duration-200"
      :class="[
        item.active
          ? 'text-blue-600 dark:text-blue-400'
          : 'text-neutral-500 dark:text-neutral-400',
      ]"
    >
      <div
        class="text-xl transition-colors"
        :class="[
          item.icon,
          item.active
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-neutral-500 dark:text-neutral-400',
        ]"
      />
      <span>{{ item.label }}</span>
    </NuxtLink>

    <button
      v-if="loggedIn"
      class="flexcenter flex-col gap-1 border-0 rounded-lg bg-transparent px-3 py-1 text-xs transition-colors duration-200"
      type="button"
      title="Upload gambar"
      @click="requestUpload"
    >
      <div class="i-mingcute:add-line text-xl transition-colors" />
      <span>Upload</span>
    </button>

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

  <Transition
    enter-active-class="transition-opacity duration-200"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity duration-200"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="showSettings"
      class="fixed inset-0 z-[60] overflow-x-hidden bg-black/50 md:hidden"
      @click.self="closeSettings"
    >
      <Transition
        enter-active-class="transition-transform duration-300"
        enter-from-class="translate-y-full"
        enter-to-class="translate-y-0"
        leave-active-class="transition-transform duration-300"
        leave-from-class="translate-y-0"
        leave-to-class="translate-y-full"
      >
        <div
          v-if="showSettings"
          class="absolute inset-x-0 bottom-0 box-border max-w-full rounded-t-2xl bg-white px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 shadow-lg dark:bg-neutral-900"
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
          <div class="min-w-0" flex items-center justify-between gap-4>
            <span text-sm text-neutral-700 dark:text-neutral-300>Dark Mode</span>
            <button
              type="button"
              role="switch"
              :aria-checked="isDarkMode"
              :aria-disabled="isTransitioning"
              class="relative h-7 w-12 shrink-0 cursor-pointer rounded-full border-none bg-neutral-200 transition-colors duration-200 dark:bg-neutral-700"
              :class="isDarkMode ? 'bg-neutral-900 dark:bg-neutral-600' : ''"
              @click="toggleColorMode"
            >
              <span
                class="absolute left-1 top-1 h-5 w-5 flex items-center justify-center rounded-full bg-white text-neutral-700 shadow transition-transform duration-700"
                :class="isDarkMode ? 'translate-x-5 rotate-180' : 'translate-x-0 rotate-0'"
              >
                <span
                  class="absolute text-xs transition-[opacity,transform] duration-700"
                  :class="isDarkMode ? 'i-mingcute:moon-stars-line rotate-180 scale-100 opacity-100' : 'i-mingcute:sun-line rotate-0 scale-100 opacity-100'"
                  aria-hidden="true"
                />
              </span>
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>
