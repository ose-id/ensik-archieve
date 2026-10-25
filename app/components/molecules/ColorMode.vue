<script setup vapor lang="ts">
const { isTransitioning, toggleColorMode } = useAnimatedColorMode();
</script>

<template>
  <!--
    Icons and tooltip text follow the `dark` class that color-mode puts on <html>
    before the first paint, instead of `isDarkMode`, which the server can't know.
    That keeps the server and client markup identical during hydration.
  -->
  <button
    type="button"
    class="group rail-item"
    :aria-disabled="isTransitioning"
    aria-label="Ganti mode terang/gelap"
    @click="toggleColorMode"
  >
    <span class="size-6 relative" aria-hidden="true">
      <span class="i-mingcute:sun-line size-6 transition-[opacity,transform] duration-700 inset-0 absolute dark:(opacity-0 rotate-90 scale-50)" />
      <span class="i-mingcute:moon-stars-line opacity-0 size-6 scale-50 transition-[opacity,transform] duration-700 inset-0 absolute dark:(opacity-100 rotate-0 scale-100) -rotate-90" />
    </span>
    <span class="rail-tooltip">
      <span class="dark:hidden">Mode gelap</span>
      <span class="hidden dark:inline">Mode terang</span>
    </span>
  </button>
</template>
