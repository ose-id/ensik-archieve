<script setup lang="ts">
import type { ImageOptions } from '@nuxt/image';

type EnsikImage = (
  source: string,
  modifiers?: ImageOptions<'ensik'>['modifiers'],
  options?: ImageOptions<'ensik'>,
) => string;

const props = withDefaults(defineProps<{
  alt?: string;
  src: string;
}>(), {
  alt: 'Pratinjau gambar',
});

const stage = ref<HTMLElement>();
const lens = ref<HTMLElement>();
const ensikImage = useImage() as unknown as EnsikImage;
const cachedHighQuality = ref(false);
const highQualityReady = ref(false);
const highQualitySrc = ref('');
const previewSrc = ref('');
const lowQualityLoaded = ref(false);
const lensVisible = ref(false);
const zoomScale = ref(2);
const lensSize = ref(160);
let animationFrame = 0;
let pointerClientX = 0;
let pointerClientY = 0;

const requestedHighQualitySrc = computed(() => ensikImage(
  props.src,
  {
    fit: 'inside',
    format: 'webp',
    quality: 100,
    width: 1920,
  },
  { provider: 'ensik' },
));

const lensStyle = computed(() => ({
  backgroundImage: highQualitySrc.value ? `url("${highQualitySrc.value}")` : undefined,
  backgroundRepeat: 'no-repeat',
  height: `${lensSize.value}px`,
  opacity: lensVisible.value && highQualityReady.value ? 1 : 0,
  transform: 'translate(-50%, -50%)',
  width: `${lensSize.value}px`,
}));

watch(() => props.src, useCachedHighQuality, { immediate: import.meta.client });
watch([zoomScale, lensSize], scheduleLensUpdate);

onBeforeUnmount(() => {
  if (animationFrame)
    cancelAnimationFrame(animationFrame);
});

function useCachedHighQuality() {
  previewSrc.value = getArchiveImagePreview(props.src) || '';
  cachedHighQuality.value = isArchiveImagePreloaded(requestedHighQualitySrc.value);
  highQualityReady.value = cachedHighQuality.value;
  highQualitySrc.value = cachedHighQuality.value ? requestedHighQualitySrc.value : '';
  lowQualityLoaded.value = Boolean(previewSrc.value) && !cachedHighQuality.value;
  lensVisible.value = false;
}

function startHighQualityLoad() {
  highQualityReady.value = false;
  lowQualityLoaded.value = true;
}

function finishHighQualityLoad(event: Event) {
  const image = event.target as HTMLImageElement;
  highQualitySrc.value = image.currentSrc || image.src;
  markArchiveImagePreloaded(highQualitySrc.value);
  highQualityReady.value = true;
}

function renderLens() {
  animationFrame = 0;
  const bounds = stage.value?.getBoundingClientRect();
  const element = lens.value;
  if (!bounds || !element)
    return;

  const x = Math.min(Math.max(pointerClientX - bounds.left, 0), bounds.width);
  const y = Math.min(Math.max(pointerClientY - bounds.top, 0), bounds.height);
  Object.assign(element.style, {
    backgroundPosition: `${lensSize.value / 2 - x * zoomScale.value}px ${lensSize.value / 2 - y * zoomScale.value}px`,
    backgroundSize: `${bounds.width * zoomScale.value}px ${bounds.height * zoomScale.value}px`,
    left: `${x}px`,
    top: `${y}px`,
  });
}

function scheduleLensUpdate() {
  if (!animationFrame)
    animationFrame = requestAnimationFrame(renderLens);
}

function updateLens(event: PointerEvent) {
  pointerClientX = event.clientX;
  pointerClientY = event.clientY;
  scheduleLensUpdate();
}

function showLens(event: PointerEvent) {
  if (event.pointerType === 'touch')
    return;

  updateLens(event);
  lensVisible.value = true;
}

function hideLens() {
  lensVisible.value = false;
}
</script>

<template>
  <div class="max-w-full flex flex-col items-center justify-center">
    <div
      ref="stage"
      class="relative inline-block max-w-full"
      :class="highQualityReady ? 'cursor-zoom-in' : 'cursor-progress'"
      role="img"
      :aria-label="alt"
      @pointerenter="showLens"
      @pointermove="updateLens"
      @pointerleave="hideLens"
    >
      <img
        v-if="cachedHighQuality"
        :src="requestedHighQualitySrc"
        alt=""
        width="1920"
        loading="eager"
        decoding="async"
        fetchpriority="high"
        class="block max-h-[82vh] max-w-[calc(100vw-3rem)] w-auto object-contain md:max-w-[calc(100vw-10rem)]"
        @load="finishHighQualityLoad"
      >
      <img
        v-else-if="previewSrc"
        :src="previewSrc"
        alt=""
        loading="eager"
        decoding="async"
        fetchpriority="high"
        class="block max-h-[82vh] max-w-[calc(100vw-3rem)] w-auto object-contain md:max-w-[calc(100vw-10rem)]"
      >
      <NuxtImg
        v-else
        provider="ensik"
        :src="src"
        alt=""
        width="480"
        format="webp"
        quality="20"
        fit="inside"
        loading="eager"
        decoding="async"
        fetchpriority="high"
        class="block max-h-[82vh] max-w-[calc(100vw-3rem)] w-auto object-contain md:max-w-[calc(100vw-10rem)]"
        @load="startHighQualityLoad"
      />
      <NuxtImg
        v-if="lowQualityLoaded"
        provider="ensik"
        :src="src"
        alt=""
        width="1920"
        format="webp"
        quality="100"
        fit="inside"
        loading="eager"
        decoding="async"
        class="absolute inset-0 h-full w-full object-contain transition-opacity duration-200"
        :class="highQualityReady ? 'opacity-100' : 'opacity-0'"
        @load="finishHighQualityLoad"
      />
      <span
        ref="lens"
        class="pointer-events-none absolute z-2 border-2 border-white rounded-full border-solid shadow-2xl transition-opacity duration-150"
        :style="lensStyle"
        aria-hidden="true"
      />
    </div>

    <div class="mt-4 flex flex-wrap items-center justify-center gap-4 rounded-full bg-black/60 px-5 py-2.5 text-white backdrop-blur-sm">
      <label class="flex items-center gap-2 text-xs font-medium sm:text-sm">
        Zoom
        <input
          v-model.number="zoomScale"
          type="range"
          class="w-24 cursor-pointer accent-white sm:w-32"
          min="1.5"
          max="5"
          step="0.1"
        >
        <span class="w-8 text-right tabular-nums">{{ zoomScale.toFixed(1) }}x</span>
      </label>
      <label class="flex items-center gap-2 text-xs font-medium sm:text-sm">
        Lensa
        <input
          v-model.number="lensSize"
          type="range"
          class="w-24 cursor-pointer accent-white sm:w-32"
          min="80"
          max="220"
          step="10"
        >
      </label>
    </div>

    <p class="mb-0 mt-2 hidden text-xs text-white/70 md:block">
      Arahkan kursor ke gambar untuk menggunakan lensa.
    </p>
  </div>
</template>
