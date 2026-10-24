<script setup vapor lang="ts">
defineProps<{
  disabled?: boolean;
}>();

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();
</script>

<template>
  <button
    type="button"
    :disabled="disabled"
    class="text-neutral-500 p-2 outline-none flex cursor-pointer origin-center transition-[color,opacity,transform] duration-300 items-center justify-center dark:text-neutral-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed hover:rotate-90 active:scale-95 focus:scale-110 hover:scale-110 hover:!text-red-500 dark:hover:!text-red-500"
    @click="emit('click', $event)"
  >
    <span class="i-mingcute:close-line text-2xl drop-shadow-xs sm:text-3xl" aria-hidden="true" />
    <slot />
  </button>
</template>
