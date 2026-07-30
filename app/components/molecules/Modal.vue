<script setup lang="ts">
const props = withDefaults(defineProps<{
  closeDisabled?: boolean;
  description?: string;
  open: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  title: string;
}>(), {
  closeDisabled: false,
  description: undefined,
  size: 'md',
});

const emit = defineEmits<{
  close: [];
}>();

const SIZE_CLASSES = {
  lg: 'max-w-3xl',
  md: 'max-w-xl',
  sm: 'max-w-sm',
  xl: 'max-w-5xl',
} as const;

const dialog = ref<HTMLElement>();
const titleId = useId();
let previouslyFocused: HTMLElement | null = null;

const sizeClass = computed(() => SIZE_CLASSES[props.size]);

watch(() => props.open, async (open) => {
  if (!import.meta.client)
    return;

  if (open) {
    previouslyFocused = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    await nextTick();
    dialog.value?.focus();
  }
  else {
    document.body.style.overflow = '';
    previouslyFocused?.focus();
    previouslyFocused = null;
  }
});

onKeyStroke('Escape', () => {
  if (props.open)
    requestClose();
});

onBeforeUnmount(() => {
  if (import.meta.client)
    document.body.style.overflow = '';
});

function requestClose() {
  if (!props.closeDisabled)
    emit('close');
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-150"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-150"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-5"
        @click.self="requestClose"
      >
        <section
          ref="dialog"
          tabindex="-1"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          :aria-describedby="description ? `${titleId}-description` : undefined"
          class="max-h-[calc(100dvh-1.5rem)] w-full overflow-hidden rounded-2xl bg-white shadow-2xl outline-none sm:max-h-[calc(100dvh-2.5rem)] dark:bg-neutral-900"
          :class="sizeClass"
        >
          <header class="flex items-start justify-between gap-4 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800 sm:px-6 sm:py-4">
            <div class="min-w-0">
              <h2 :id="titleId" class="m-0 text-lg text-neutral-900 font-semibold dark:text-white">
                {{ title }}
              </h2>
              <p
                v-if="description"
                :id="`${titleId}-description`"
                class="mb-0 mt-1 text-sm text-neutral-500 dark:text-neutral-400"
              >
                {{ description }}
              </p>
            </div>
            <AtomsCloseButton :disabled="closeDisabled" class="shrink-0" @click="requestClose" />
          </header>

          <div class="max-h-[calc(100dvh-11rem)] overflow-y-auto p-4 sm:p-6">
            <slot />
          </div>

          <footer
            v-if="$slots.footer"
            class="border-t border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950/60 sm:px-6 sm:py-4"
          >
            <slot name="footer" />
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>
