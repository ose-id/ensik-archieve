<template vapor>
  <!-- Mirrors the masonry column count (2 / md:3 / lg:4 / xl:5) with CSS only, so it matches before JS knows the viewport. -->
  <div class="flex gap-3 items-start" aria-hidden="true">
    <div
      v-for="column in 5"
      :key="column"
      class="flex-1 flex-col gap-3 min-w-0"
      :class="[
        column > 2 ? 'hidden' : 'flex',
        column === 3 ? 'md:flex' : '',
        column === 4 ? 'lg:flex' : '',
        column === 5 ? 'xl:flex' : '',
      ]"
    >
      <div
        v-for="row in 3"
        :key="row"
        class="rounded-2xl bg-neutral-200 animate-pulse dark:bg-neutral-800"
        :class="(row + column) % 3 === 0
          ? 'h-72'
          : (row + column) % 2 === 0
            ? 'h-48'
            : 'h-60'"
      />
    </div>
  </div>
</template>
