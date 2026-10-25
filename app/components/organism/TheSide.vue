<script setup vapor lang="ts">
const { loggedIn, menuItems } = useArchiveNavigation();
const { requestUpload } = useArchiveEvents();
</script>

<template>
  <!-- Pinterest-style rail: outline icons that fill in once their page is active, with labels as hover tooltips. -->
  <aside
    class="py-4 border-r border-neutral-200 bg-white flex-col w-20 hidden items-center inset-y-0 left-0 fixed z-50 dark:(border-neutral-800 bg-neutral-950) md:flex"
    aria-label="Navigasi samping"
  >
    <NuxtLink to="/" class="group rail-item" aria-label="Ensik Archive">
      <NuxtImg src="/img/logo.jpg" alt="" width="32" height="32" class="rounded-full size-8" />
      <span class="rail-tooltip">Ensik Archive</span>
    </NuxtLink>

    <nav class="mt-4 flex flex-1 flex-col gap-2 items-center">
      <NuxtLink
        v-for="item in menuItems"
        :key="item.route"
        :to="item.route"
        class="group rail-item"
        :class="item.active ? 'rail-item-active' : ''"
        :aria-label="item.label"
        :aria-current="item.active ? 'page' : undefined"
      >
        <span class="size-6" :class="item.active ? item.activeIcon : item.icon" aria-hidden="true" />
        <span class="rail-tooltip">{{ item.label }}</span>
      </NuxtLink>

      <button
        v-if="loggedIn"
        type="button"
        class="group rail-item"
        aria-label="Upload foto"
        @click="requestUpload"
      >
        <span class="i-mingcute:add-square-line size-6" aria-hidden="true" />
        <span class="rail-tooltip">Upload foto</span>
      </button>
    </nav>

    <MoleculesColorMode />
  </aside>
</template>
