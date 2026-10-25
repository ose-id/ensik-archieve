<script setup vapor lang="ts">
import type { MasonryItem } from '~/composables/useArchiveMasonry';

const props = defineProps<{
  items: MasonryItem[];
  /** Called when stepping past the last item, so the owner can load the next page first. */
  loadMore?: () => Promise<void>;
}>();

/** Key of the open item; `undefined` closes the viewer. */
const selectedKey = defineModel<string | undefined>('selectedKey');

const selectedIndex = computed(() => props.items.findIndex(item => item.key === selectedKey.value));
const selectedImage = computed(() => props.items[selectedIndex.value]?.image);

watch(selectedImage, (image) => {
  if (import.meta.client)
    document.body.style.overflow = image ? 'hidden' : '';
});

onBeforeUnmount(() => {
  if (import.meta.client)
    document.body.style.overflow = '';
});

onKeyStroke('Escape', close);
onKeyStroke('ArrowRight', () => void next());
onKeyStroke('ArrowLeft', previous);

function close() {
  selectedKey.value = undefined;
}

async function next() {
  const index = selectedIndex.value;
  if (index === -1 || props.items.length < 2)
    return;

  if (index === props.items.length - 1)
    await props.loadMore?.();
  selectedKey.value = props.items[(index + 1) % props.items.length]?.key;
}

function previous() {
  const index = selectedIndex.value;
  if (index === -1 || props.items.length < 2)
    return;

  selectedKey.value = props.items[(index - 1 + props.items.length) % props.items.length]?.key;
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="selectedImage"
      class="p-3 bg-black/95 flex items-center inset-0 justify-center fixed z-[100] backdrop-blur-xs md:p-8"
      role="dialog"
      aria-modal="true"
      :aria-label="`Pratinjau ${selectedImage.name}`"
      @click.self="close"
    >
      <AtomsCloseButton
        class="right-3 top-3 absolute z-20 !text-white md:right-6 md:top-6"
        @click="close"
      />
      <AtomsArrowButton
        v-if="items.length > 1"
        direction="left"
        class="left-2 absolute z-20 !text-white md:left-6"
        @click="previous"
      />
      <MoleculesZoomLens
        :key="selectedImage.id"
        :src="selectedImage.id"
        :alt="`Pratinjau ${selectedImage.name}`"
      />
      <AtomsArrowButton
        v-if="items.length > 1"
        direction="right"
        class="right-2 absolute z-20 !text-white md:right-6"
        @click="next"
      />
    </div>
  </Teleport>
</template>
