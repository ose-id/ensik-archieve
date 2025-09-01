<script setup lang="ts">
const colorMode = useColorMode();

function toggleMode() {
  colorMode.preference = colorMode.value === 'light' ? 'dark' : 'light';
}
</script>

<template>
  <button cursor-pointer rounded border-none bg-transparent p-2 lg:hover:bg-neutral-100 lg:dark:hover:bg-neutral-700 aria-label="Color Mode" @click="toggleMode">
    <div i-mingcute:sun-line dark:i-mingcute:moon-stars-line text-xl />
  </button>
</template>
