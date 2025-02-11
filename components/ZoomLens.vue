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
  <div>
    <div relative size-full overflow-hidden :style="{ cursor }" @mousemove="mouseMoved" @mouseenter="onMouseEnter" @mouseleave="onMouseLeave">
      <div
        class="magic-zoom-lens"
        pointer-events-none absolute isolate z-1 overflow-hidden border-2 border-white rounded-full border-solid
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
        object-cover
        max="h-[80vh] w-full"
        :alt="props.alt || 'Zoomed Image'"
        :src="props.src"
        @load="onImageLoaded"
      />
    </div>
    <div class="mt-4 flex space-x-4 items-center justify-between">
      <div class="flex items-center space-x-2">
      <label class="text-white">Zoom Level:</label>
      <input type="range" min="1" max="5" step="0.1" v-model="zoomScale" class="cursor-pointer">
      </div>
      <div class="flex items-center space-x-2">
      <label class="text-white">Circle Size:</label>
      <input type="range" min="50" max="200" step="10" v-model="lensSize" class="cursor-pointer">
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
