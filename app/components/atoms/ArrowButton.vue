<script setup lang="ts">
const props = defineProps<{
  direction: 'left' | 'right' | 'up' | 'down';
  disabled?: boolean;
}>();

defineEmits<{
  click: [event: MouseEvent];
}>();

const ICON_CLASSES = {
  down: 'i-mingcute:down-line',
  left: 'i-mingcute:left-line',
  right: 'i-mingcute:right-line',
  up: 'i-mingcute:up-line',
} as const;

const iconClass = computed(() => ICON_CLASSES[props.direction]);
</script>

<template>
  <button
    type="button"
    :disabled="disabled"
    class="flex cursor-pointer items-center justify-center border-none bg-transparent p-2 text-neutral-500 outline-none transition-[color,opacity,transform] duration-300 active:scale-95 focus:scale-110 hover:scale-110 disabled:cursor-not-allowed dark:text-neutral-400 hover:text-neutral-900 disabled:opacity-50 focus:outline-none dark:hover:text-white"
    @click="$emit('click', $event)"
  >
    <span
      class="text-3xl drop-shadow-sm md:text-5xl sm:text-4xl"
      :class="iconClass"
      aria-hidden="true"
    />
    <slot />
  </button>
</template>
