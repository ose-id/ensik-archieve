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
    <span class="h-5 w-5 relative" aria-hidden="true">
      <span class="i-mingcute:sun-line text-xl opacity-100 rotate-0 scale-100 transition-[opacity,transform] duration-700 inset-0 absolute dark:(opacity-0 rotate-90 scale-50)" />
      <span class="i-mingcute:moon-stars-line text-xl opacity-0 scale-50 transition-[opacity,transform] duration-700 inset-0 absolute dark:(opacity-100 rotate-0 scale-100) -rotate-90" />
    </span>
  </AtomsButton>
</template>
