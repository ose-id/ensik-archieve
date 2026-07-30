<script setup lang="ts">
useSeoMeta({
  description: 'Koleksi gambar komunitas yang telah diarsipkan.',
  twitterCard: 'summary_large_image',
});
</script>

<template>
  <div id="top" min-h-dvh>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <OrganismToastContainer />
  </div>
</template>

<style lang="postcss">
:root {
  scrollbar-gutter: auto;
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
  @apply bg-white dark:bg-black m-0 overflow-x-hidden font-sans text-black dark:text-white;
}
button,
input,
optgroup,
select,
textarea {
  font: inherit;
}
.dark {
  color-scheme: dark;
}
a {
  @apply !no-underline text-black dark:text-white;
}

@media (min-width: 768px) {
  :root {
    scrollbar-gutter: stable;
  }
}

@media (max-width: 767px) {
  :root {
    scrollbar-width: none;
  }
  ::-webkit-scrollbar {
    display: none;
  }
}

::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
}
::view-transition-old(root) {
  z-index: 1;
}
::view-transition-new(root) {
  clip-path: var(--ensik-color-mode-clip, none);
  z-index: 2;
}
html[data-color-mode-transition='fallback'],
html[data-color-mode-transition='fallback'] *,
html[data-color-mode-transition='fallback'] *::before,
html[data-color-mode-transition='fallback'] *::after {
  transition-duration: 700ms;
  transition-property: background-color, border-color, color, fill, stroke;
  transition-timing-function: ease-out;
}
html[data-color-mode-transition='reveal'] *,
html[data-color-mode-transition='reveal'] *::before,
html[data-color-mode-transition='reveal'] *::after {
  transition-property: opacity, transform !important;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
