<script setup lang="ts">
const props = defineProps<{
  src?: string;
  alt?: string;
}>();

const isImageHovered = ref(false);
const imageWidth = ref(0);
const imageHeight = ref(0);
const lensX = ref(0);
const lensY = ref(0);

const zoomScale = ref(1.7);
const lensSize = ref(150);

const opacity = computed(() => (isImageHovered.value ? 1 : 0));
const cursor = computed(() => (isImageHovered.value ? 'zoom-in' : 'default'));

function mouseMoved(event: MouseEvent) {
  lensX.value = event.offsetX;
  lensY.value = event.offsetY;
}

function onMouseEnter() {
  isImageHovered.value = true;
}

function onMouseLeave() {
  isImageHovered.value = false;
}

async function onImageLoaded(event: Event) {
  const img = event.target as HTMLImageElement;
  imageHeight.value = img.clientHeight;
  imageWidth.value = img.clientWidth;
}
</script>

<template>
  <div class="h-full w-full flex flex-col items-center justify-center">
    <div class="relative inline-block" :style="{ cursor }" @mousemove="mouseMoved" @mouseenter="onMouseEnter" @mouseleave="onMouseLeave">
      <div
        class="magic-zoom-lens"
        pointer-events-none absolute isolate z-1 overflow-hidden border-2 border-white rounded-full border-solid shadow-xl
        :style="{
          width: `${lensSize}px`,
          height: `${lensSize}px`,
          opacity,
          top: `${lensY}px`,
          left: `${lensX}px`,
        }"
      >
        <div class="magic-zoom-lens-box" :style="{ width: `${lensSize}px`, height: `${lensSize}px` }">
          <NuxtImg
            fixed inline overflow-hidden object-cover
            :src="props.src"
            :style="{
              width: `${imageWidth * zoomScale}px`,
              height: `${imageHeight * zoomScale}px`,
              transform: `translate(${-(lensX * zoomScale)}px, ${-(lensY * zoomScale)}px)`,
            }"
          />
        </div>
      </div>
      <NuxtImg
        class="max-h-[75vh] max-w-full min-w-[320px] w-auto rounded-md object-contain shadow-2xl transition-opacity duration-300 sm:min-w-[480px]"
        :alt="props.alt || 'Zoomed Image'"
        :src="props.src"
        @load="onImageLoaded"
      />
    </div>

    <div class="mt-6 flex flex-wrap items-center justify-center gap-6 rounded-full bg-black/50 px-6 py-3 text-white backdrop-blur-sm">
      <div class="flex items-center gap-3">
        <label class="text-xs font-medium md:text-sm">Zoom Level</label>
        <input v-model="zoomScale" type="range" class="w-24 cursor-pointer accent-white sm:w-32" min="1" max="5" step="0.1">
      </div>
      <div class="flex items-center gap-3">
        <label class="text-xs font-medium md:text-sm">Circle Size</label>
        <input v-model="lensSize" type="range" class="w-24 cursor-pointer accent-white sm:w-32" min="50" max="200" step="10">
      </div>
    </div>
  </div>
</template>

<style scoped>
.magic-zoom-lens {
  transition: opacity 0.25s ease-in-out;
  transform: translate(-50%, -50%);
}

.magic-zoom-lens-box {
  transform: translate(50%, 50%);
}
</style>
