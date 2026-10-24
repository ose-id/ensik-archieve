<script setup vapor lang="ts">
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

const slots = useSlots();
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
        class="p-3 bg-black/70 flex items-center inset-0 justify-center fixed z-[120] backdrop-blur-xs sm:p-5"
        @click.self="requestClose"
      >
        <section
          ref="dialog"
          tabindex="-1"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          :aria-describedby="description ? `${titleId}-description` : undefined"
          class="outline-none rounded-2xl bg-white max-h-[calc(100dvh-1.5rem)] w-full shadow-2xl overflow-hidden dark:bg-neutral-900 sm:max-h-[calc(100dvh-2.5rem)]"
          :class="sizeClass"
        >
          <header class="px-4 py-3 border-b border-neutral-200 flex gap-4 items-start justify-between sm:px-6 sm:py-4 dark:border-neutral-800">
            <div class="min-w-0">
              <h2 :id="titleId" class="text-lg text-strong font-semibold">
                {{ title }}
              </h2>
              <p
                v-if="description"
                :id="`${titleId}-description`"
                class="text-sm text-muted mt-1"
              >
                {{ description }}
              </p>
            </div>
            <AtomsCloseButton :disabled="closeDisabled" class="shrink-0" @click="requestClose" />
          </header>

          <div class="p-4 max-h-[calc(100dvh-11rem)] overflow-y-auto sm:p-6">
            <slot />
          </div>

          <footer
            v-if="slots.footer"
            class="px-4 py-3 border-t border-neutral-200 bg-neutral-50 sm:px-6 sm:py-4 dark:border-neutral-800 dark:bg-neutral-950/60"
          >
            <slot name="footer" />
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>
