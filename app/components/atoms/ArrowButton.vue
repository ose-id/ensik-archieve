<script setup vapor lang="ts">
const props = defineProps<{
  direction: 'left' | 'right' | 'up' | 'down';
  disabled?: boolean;
}>();

const emit = defineEmits<{
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
    class="text-neutral-500 p-2 outline-none flex cursor-pointer transition-[color,opacity,transform] duration-300 items-center justify-center dark:text-neutral-400 hover:text-neutral-900 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 focus:scale-110 hover:scale-110 dark:hover:text-white"
    @click="emit('click', $event)"
  >
    <span
      class="text-3xl drop-shadow-xs md:text-5xl sm:text-4xl"
      :class="iconClass"
      aria-hidden="true"
    />
    <slot />
  </button>
</template>
