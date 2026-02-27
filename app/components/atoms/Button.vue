<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  disabled?: boolean;
  title?: string;
}>();

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus:outline-none';

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'primary':
      return 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md border-none';
    case 'secondary':
      return 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700 border-none';
    case 'danger':
      return 'bg-red-500 text-white hover:bg-red-600 shadow-sm border-none';
    case 'ghost':
      return 'bg-transparent text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-neutral-100 dark:hover:bg-neutral-800 border-none';
    case 'outline':
      return 'bg-transparent border border-neutral-300 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-700';
    default:
      return 'bg-white text-black hover:bg-gray-100 border-none'; // Default fallback
  }
});

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'h-8 px-3 text-xs';
    case 'lg':
      return 'h-12 px-8 text-base';
    case 'icon':
      return 'p-2'; // Square aspect for icons
    case 'md':
    default:
      return 'h-10 px-4 py-2 text-sm';
  }
});

function handleClick(event: MouseEvent) {
  if (!props.disabled && !props.loading) {
    emit('click', event);
  }
}
</script>

<template>
  <button
    :type="type || 'button'"
    :disabled="disabled || loading"
    :class="[baseClasses, variantClasses, sizeClasses]"
    :title="title"
    @click="handleClick"
  >
    <div v-if="loading" class="mr-2 h-4 w-4 animate-spin border-2 border-current border-t-transparent rounded-full" />
    <slot />
  </button>
</template>
