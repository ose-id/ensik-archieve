<script setup lang="ts">
defineProps<{
  disabled?: boolean;
}>();

defineEmits<{
  click: [event: MouseEvent];
}>();
</script>

<template>
  <button
    type="button"
    :disabled="disabled"
    class="flex origin-center cursor-pointer items-center justify-center border-none bg-transparent p-2 text-neutral-500 outline-none transition-all duration-300 hover:rotate-90 active:scale-95 focus:scale-110 hover:scale-110 disabled:cursor-not-allowed dark:text-neutral-400 disabled:opacity-50 focus:outline-none hover:!text-red-500 dark:hover:!text-red-500"
    @click="$emit('click', $event)"
  >
    <div class="i-mingcute:close-line text-2xl drop-shadow-sm sm:text-3xl" />
    <slot />
  </button>
</template>
