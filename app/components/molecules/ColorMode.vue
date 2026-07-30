<script setup lang="ts">
const { isDarkMode, isTransitioning, toggleColorMode } = useAnimatedColorMode();
</script>

<template>
  <AtomsButton
    variant="ghost"
    size="icon"
    :aria-disabled="isTransitioning"
    :aria-label="isDarkMode ? 'Gunakan mode terang' : 'Gunakan mode gelap'"
    @click="toggleColorMode"
  >
    <span class="relative h-5 w-5" aria-hidden="true">
      <span
        class="i-mingcute:sun-line absolute inset-0 text-xl transition-[opacity,transform] duration-700"
        :class="isDarkMode ? 'rotate-90 scale-50 opacity-0' : 'rotate-0 scale-100 opacity-100'"
      />
      <span
        class="i-mingcute:moon-stars-line absolute inset-0 text-xl transition-[opacity,transform] duration-700"
        :class="isDarkMode ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-50 opacity-0'"
      />
    </span>
  </AtomsButton>
</template>
