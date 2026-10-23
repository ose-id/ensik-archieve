<script setup vapor lang="ts">
const { isTransitioning, toggleColorMode } = useAnimatedColorMode();
</script>

<template>
  <!--
    The icons follow the `dark` class that color-mode puts on <html> before the
    first paint, instead of `isDarkMode`, which the server can't know. That keeps
    the server and client markup identical during hydration.
  -->
  <AtomsButton
    variant="ghost"
    size="icon"
    :aria-disabled="isTransitioning"
    aria-label="Ganti mode terang/gelap"
    @click="toggleColorMode"
  >
    <span class="relative h-5 w-5" aria-hidden="true">
      <span class="i-mingcute:sun-line absolute inset-0 rotate-0 scale-100 text-xl opacity-100 transition-[opacity,transform] duration-700 dark:rotate-90 dark:scale-50 dark:opacity-0" />
      <span class="i-mingcute:moon-stars-line absolute inset-0 scale-50 text-xl opacity-0 transition-[opacity,transform] duration-700 -rotate-90 dark:rotate-0 dark:scale-100 dark:opacity-100" />
    </span>
  </AtomsButton>
</template>
