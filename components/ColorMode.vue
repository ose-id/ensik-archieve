<script setup lang="ts">
const colorMode = useColorMode();

function toggleMode() {
  colorMode.preference = colorMode.value === 'light' ? 'dark' : 'light';
}
</script>

<template>
  <button
    class="cursor-pointer rounded border-none bg-transparent p-2 transition ease-in-out hover:bg-gray-100 dark:hover:bg-gray-700"
    aria-label="Color Mode"
    @click="toggleMode"
  >
    <div
      i-mingcute:sun-line
      dark:i-mingcute:moon-stars-line
      text-xl
    />
  </button>
</template>
