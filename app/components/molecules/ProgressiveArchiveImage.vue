<script setup vapor lang="ts">
import type { ImageOptions } from '@nuxt/image';

type EnsikImage = (
  source: string,
  modifiers?: ImageOptions<'ensik'>['modifiers'],
  options?: ImageOptions<'ensik'>,
) => string;

const props = withDefaults(defineProps<{
  highQuality?: number;
  highWidth?: number;
  imageClass?: string;
  loading?: 'eager' | 'lazy';
  lowWidth?: number;
  priority?: boolean;
  sizes?: string;
  src: string;
}>(), {
  highQuality: 100,
  highWidth: 1920,
  imageClass: 'block h-auto w-full',
  loading: 'lazy',
  lowWidth: 480,
  priority: false,
  sizes: undefined,
});

const emit = defineEmits<{
  dimensions: [size: { height: number; width: number }];
}>();

const ensikImage = useImage() as unknown as EnsikImage;
const highQualityReady = ref(false);
const lowQualityLoaded = ref(false);
let activeSource = props.src;

const lowQualitySrc = computed(() => ensikImage(
  props.src,
  {
    fit: 'inside',
    format: 'webp',
    quality: 20,
    width: props.lowWidth,
  },
  { provider: 'ensik' },
));

const highQualitySrc = computed(() => ensikImage(
  props.src,
  {
    fit: 'inside',
    format: 'webp',
    quality: props.highQuality,
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

function reportDimensions(image: HTMLImageElement | undefined) {
  if (image?.naturalWidth && image.naturalHeight)
    emit('dimensions', { height: image.naturalHeight, width: image.naturalWidth });
}

function onLowQualityLoaded(event?: Event) {
  const image = event?.target instanceof HTMLImageElement
    ? event.target
    : undefined;
  markArchiveImagePreview(props.src, image?.currentSrc || image?.src || lowQualitySrc.value);
  reportDimensions(image);

  if (lowQualityLoaded.value)
    return;

  lowQualityLoaded.value = true;
  void loadHighQuality();
}

function onHighQualityLoaded(event: Event) {
  reportDimensions(event.target instanceof HTMLImageElement
    ? event.target
    : undefined);
}
</script>

<template>
  <div class="bg-neutral-100 relative overflow-hidden dark:bg-neutral-900">
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
      @load="onHighQualityLoaded"
    >
  </div>
</template>
