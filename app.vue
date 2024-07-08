<script lang="ts" setup>
useSeoMeta({
  description: 'Ensik Archive is a captivating online gallery platform dedicated to preserving and showcasing a rich collection of historical, and documents.',
  twitterCard: 'summary_large_image',
});
</script>

<template>
  <main
    id="top"
    min-h-dvh
  >
    <NuxtPage />
  </main>
</template>

<style lang="postcss">
* {
  @apply font-sans;
}
:root {
  scrollbar-width: thin;
  scrollbar-color: #d4d4d4 #ffffff;
}
html {
  @apply scroll-smooth;
}
html.dark {
  scrollbar-color: #1b1b1b #050505;
}
::-webkit-scrollbar {
  width: 8px;
}
::-webkit-scrollbar-thumb {
  background-color: #d4d4d4;
}
::-webkit-scrollbar-thumb:active {
  background-color: #ffffff;
}
html.dark ::-webkit-scrollbar-thumb {
  background-color: #1b1b1b;
}
html.dark ::-webkit-scrollbar-thumb:active {
  background-color: rgb(41, 41, 41);
}
html.dark ::-webkit-scrollbar {
  background-color: #050505;
}
body {
  @apply bg-white dark:bg-black m-0 transition-colors ease-in-out duration-300;
}
.dark {
  color-scheme: dark;
}
a {
  @apply !no-underline text-black dark:text-white;
}
</style>
