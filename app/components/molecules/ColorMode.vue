<script setup lang="ts">
const colorMode = useColorMode();

function toggleMode() {
  colorMode.preference = colorMode.value === 'light' ? 'dark' : 'light';
}
</script>

<template>
  <AtomsButton variant="ghost" size="icon" aria-label="Color Mode" @click="toggleMode">
    <div i-mingcute:sun-line dark:i-mingcute:moon-stars-line text-xl />
  </AtomsButton>
</template>
