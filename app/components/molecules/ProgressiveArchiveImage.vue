<script setup lang="ts">
import type { ImageOptions } from '@nuxt/image';

type EnsikImage = (
  source: string,
  modifiers?: ImageOptions<'ensik'>['modifiers'],
  options?: ImageOptions<'ensik'>,
) => string;

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(defineProps<{
  highWidth?: number;
  imageClass?: string;
  loading?: 'eager' | 'lazy';
  lowWidth?: number;
  priority?: boolean;
  sizes?: string;
  src: string;
}>(), {
  highWidth: 1920,
  imageClass: 'block h-auto w-full',
  loading: 'lazy',
  lowWidth: 480,
  priority: false,
  sizes: undefined,
});

const ensikImage = useImage() as unknown as EnsikImage;
const highQualityReady = ref(false);
const lowQualityLoaded = ref(false);
let activeSource = props.src;

const highQualitySrc = computed(() => ensikImage(
  props.src,
  {
    fit: 'inside',
    format: 'webp',
    quality: 100,
    width: props.highWidth,
  },
  { provider: 'ensik' },
));

watch(() => props.src, (source) => {
  activeSource = source;
  highQualityReady.value = isArchiveImagePreloaded(highQualitySrc.value);
  lowQualityLoaded.value = false;
});

watch(() => props.priority, (priority) => {
  if (priority && lowQualityLoaded.value && !highQualityReady.value)
    void loadHighQuality();
});

onMounted(() => {
  highQualityReady.value = isArchiveImagePreloaded(highQualitySrc.value);
});

async function loadHighQuality() {
  const source = activeSource;
  const loaded = await preloadArchiveImage(highQualitySrc.value, props.priority);
  if (loaded && source === activeSource)
    highQualityReady.value = true;
}

function onLowQualityLoaded() {
  if (lowQualityLoaded.value)
    return;

  lowQualityLoaded.value = true;
  void loadHighQuality();
}
</script>

<template>
  <div
    v-bind="$attrs"
    class="relative overflow-hidden bg-neutral-100 dark:bg-neutral-900"
  >
    <NuxtImg
      v-if="!highQualityReady"
      provider="ensik"
      :src="src"
      alt=""
      :width="lowWidth"
      :sizes="sizes"
      format="webp"
      quality="20"
      fit="inside"
      :loading="loading"
      decoding="async"
      :fetchpriority="priority ? 'high' : 'low'"
      :class="imageClass"
      @load="onLowQualityLoaded"
    />
    <img
      v-else
      :src="highQualitySrc"
      alt=""
      :width="highWidth"
      decoding="async"
      :class="imageClass"
    >
  </div>
</template>
