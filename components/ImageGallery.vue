<script setup lang="ts">
const images = ref<{ url: string; pathname: string }[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);

const showDetailModal = ref(false);
const selectedImage = ref<{ url: string; pathname: string } | null>(null);
const zoomLevel = ref(1);
const translateX = ref(0);
const translateY = ref(0);
const isDragging = ref(false);
const lastMousePosition = ref<{ x: number; y: number } | null>(null);

onMounted(async () => {
  try {
    images.value = await $fetch('/api/images');
  }
  catch (err) {
    console.error('Failed to fetch images:', err);
    error.value = 'Failed to load images.';
  }
  finally {
    isLoading.value = false;
  }

  document.addEventListener('keydown', handleKeyDown);
});

const getUsername = (pathname: string) => {
  return pathname.split('-')[0];
};

const openDetailModal = (image: { url: string; pathname: string }) => {
  selectedImage.value = image;
  showDetailModal.value = true;
  resetPosition();
};

const closeDetailModal = () => {
  showDetailModal.value = false;
  selectedImage.value = null;
};

const resetPosition = () => {
  zoomLevel.value = 1;
  translateX.value = 0;
  translateY.value = 0;
};

const handleWheel = (event: WheelEvent) => {
  if (event.deltaY < 0) {
    zoomIn();
  }
  else if (event.deltaY > 0) {
    zoomOut();
  }
};

const zoomIn = () => {
  zoomLevel.value = Math.min(zoomLevel.value + 0.1, 2);
};

const zoomOut = () => {
  zoomLevel.value = Math.max(zoomLevel.value - 0.1, 0.5);
};

const handleMouseDown = (event: MouseEvent) => {
  isDragging.value = true;
  lastMousePosition.value = { x: event.clientX, y: event.clientY };
};

const handleMouseMove = (event: MouseEvent) => {
  if (isDragging.value) {
    const newX = event.clientX;
    const newY = event.clientY;
    const deltaX = newX - (lastMousePosition.value?.x || 0);
    const deltaY = newY - (lastMousePosition.value?.y || 0);
    translateX.value += deltaX;
    translateY.value += deltaY;
    lastMousePosition.value = { x: newX, y: newY };
  }
};

const handleMouseUp = () => {
  isDragging.value = false;
  lastMousePosition.value = null;
};

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closeDetailModal();
  }
};

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown);
});
</script>

<template>
  <div class="container mx-auto px-4 py-12">
    <div
      v-if="isLoading"
      class="flex justify-center items-center h-64"
    >
      <div class="i-lucide-loader-2 animate-spin text-4xl text-gray-900" />
    </div>

    <div
      v-else-if="error"
      class="text-center text-red-500 p-4 bg-red-100 rounded-lg"
    >
      {{ error }}
    </div>

    <div
      v-else-if="images.length === 0"
      class="text-center text-gray-500 p-4 bg-gray-100 rounded-lg"
    >
      No images uploaded yet.
    </div>

    <div
      v-else
      class="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4"
    >
      <div
        v-for="image in images"
        :key="image.pathname"
        class="break-inside-avoid"
      >
        <div class="relative overflow-hidden rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
          <NuxtImg
            :src="image.url"
            :alt="image.pathname"
            class="w-full h-full object-cover block"
            @click="openDetailModal(image)"
          />
          <div class="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 text-sm truncate">
            {{ getUsername(image.pathname) }}
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal untuk melihat gambar secara detail -->
  <div
    v-if="showDetailModal"
    class="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50"
  >
    <div class="relative bg-transparent w-11/12 md:w-1/2 lg:w-1/3">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center" />

      <!-- Content -->
      <div class="px-6 py-4 flex justify-center items-center">
        <div
          class="relative w-full h-full"
          @wheel.prevent="handleWheel"
          @mousedown="handleMouseDown"
          @mousemove="handleMouseMove"
          @mouseup="handleMouseUp"
        >
          <img
            :src="selectedImage?.url"
            alt="Gambar Detail"
            class="w-full h-full object-cover block"
            :style="{ transform: `scale(${zoomLevel}) translate(${translateX}px, ${translateY}px)` }"
          >
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-4 border-t border-gray-200 flex justify-center">
        <!-- Tombol untuk menutup modal -->
        <button
          class="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-300 transform hover:scale-105"
          @click="closeDetailModal"
        >
          Tutup
        </button>
      </div>
    </div>
  </div>
</template>
