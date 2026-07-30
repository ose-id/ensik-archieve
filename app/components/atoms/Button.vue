<script setup lang="ts">
type ButtonSize = 'icon' | 'lg' | 'md' | 'sm';
type ButtonVariant = 'danger' | 'ghost' | 'outline' | 'primary' | 'secondary';

const props = withDefaults(defineProps<{
  type?: 'button' | 'submit' | 'reset';
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  title?: string;
}>(), {
  disabled: false,
  loading: false,
  size: 'md',
  title: undefined,
  type: 'button',
  variant: 'outline',
});

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  danger: 'bg-red-500 text-white hover:bg-red-600 shadow-sm border-none',
  ghost: 'bg-transparent text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-neutral-100 dark:hover:bg-neutral-800 border-none',
  outline: 'bg-transparent border border-neutral-300 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-700',
  primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md border-none',
  secondary: 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700 border-none',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  icon: 'p-2',
  lg: 'h-12 px-8 text-base',
  md: 'h-10 px-4 py-2 text-sm',
  sm: 'h-8 px-3 text-xs',
};

const baseClasses = 'inline-flex cursor-pointer items-center justify-center rounded-md font-sans font-medium transition-[background-color,border-color,color,box-shadow] duration-200 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none';
const variantClasses = computed(() => VARIANT_CLASSES[props.variant]);
const sizeClasses = computed(() => SIZE_CLASSES[props.size]);

function handleClick(event: MouseEvent) {
  if (!props.disabled && !props.loading) {
    emit('click', event);
  }
}
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="[baseClasses, variantClasses, sizeClasses]"
    :title="title"
    @click="handleClick"
  >
    <span v-if="loading" class="mr-2 h-4 w-4 animate-spin border-2 border-current border-t-transparent rounded-full" aria-hidden="true" />
    <slot />
  </button>
</template>
