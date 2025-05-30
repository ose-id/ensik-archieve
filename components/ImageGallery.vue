<script setup lang="ts">
const images = ref<{ url: string; pathname: string; loaded: boolean }[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);
const showPopup = ref(false);
const selectedImage = ref<{ url: string; pathname: string; loaded: boolean } | null>(null);
const currentIndex = ref(0);

onMounted(async () => {
  try {
    const fetchedImages = await $fetch('/api/images');
    images.value = Array.isArray(fetchedImages)
      ? fetchedImages.map(img => ({ ...img, loaded: false }))
      : [];
  }
  catch (err) {
    console.error('Failed to fetch images:', err);
    error.value = 'Failed to load images.';
  }
  finally {
    isLoading.value = false;
  }
});

const getUsername = (pathname: string) => pathname.split('-')[0];

function handleImageLoaded(index: number) {
  if (index >= 0 && index < images.value.length) {
    images.value[index].loaded = true;
  }
}

function openPopup(image: { url: string; pathname: string; loaded: boolean }, index: number) {
  selectedImage.value = image;
  currentIndex.value = index;
  showPopup.value = true;
}

function closePopup() {
  showPopup.value = false;
  selectedImage.value = null;
}

function nextImage() {
  if (currentIndex.value < images.value.length - 1) {
    currentIndex.value++;
    selectedImage.value = images.value[currentIndex.value];
  }
}

function prevImage() {
  if (currentIndex.value > 0) {
    currentIndex.value--;
    selectedImage.value = images.value[currentIndex.value];
  }
}

async function downloadImage(image: { url: string; pathname: string }) {
  try {
    const response = await fetch(image.url);
    const blob = await response.blob();

    const extensionRegex = /\.(jpg|jpeg|png|gif|webp)$/i;
    const match = image.pathname.match(extensionRegex);
    let filename = image.pathname;
    if (!match) {
      filename += '.jpg';
    }

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  catch (err) {
    console.error('Failed to download image:', err);
  }
}
</script>

<template>
  <div mx-auto pb-12>
    <div v-if="isLoading" h-64 flex items-center justify-center>
      <div i-mingcute-loading-fill animate-spin text-4xl text-gray-900 dark:text-white />
    </div>
    <div v-else-if="error" rounded-lg bg-red-100 p-4 text-center text-red-500>
      {{ error }}
    </div>
    <div v-else-if="images.length === 0" rounded-lg bg-gray-100 p-4 text-center text-gray-500>
      No images uploaded yet.
    </div>

    <div v-else columns-2 gap-4 lg:columns-4 md:columns-3 xl:columns-5 space-y-4>
      <div
        v-for="(image, index) in images"
        :key="image.pathname"
        break-inside-avoid
      >
        <div
          class="relative cursor-pointer overflow-hidden rounded-lg shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
          @click="openPopup(image, index)"
        >
          <div class="aspect-w-4 aspect-h-3 bg-gray-100">
            <div
              v-if="!image.loaded"
              class="absolute inset-0 flex items-center justify-center"
            >
              <div i-mingcute-loading-fill animate-spin text-2xl text-gray-500 />
            </div>

            <NuxtImg
              :src="image.url"
              :alt="image.pathname"
              class="block h-full w-full object-cover transition-opacity duration-300"
              :class="{ 'opacity-0': !image.loaded, 'opacity-100': image.loaded }"
              @load="handleImageLoaded(index)"
            />
          </div>

          <div class="absolute inset-0 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100" />
          <div class="absolute bottom-0 left-0 right-0 truncate bg-black/50 p-2 text-xs text-white md:text-sm">
            {{ getUsername(image.pathname) }}
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-if="showPopup" fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90>
    <button class="i-mingcute:arrow-left-circle-line absolute left-4 top-1/2 z-10 transform cursor-pointer text-3xl text-white -translate-y-1/2 hover:text-blue-300" @click="prevImage" />
    <div class="relative max-w-3xl w-[60%] flex flex-col items-center rounded-lg bg-gray-900/70 p-4 lg:w-full">
      <button class="i-mingcute:close-circle-line hover:i-mingcute:close-circle-fill absolute cursor-pointer text-4xl text-red -right-4 -top-4 hover:bg-red" @click="closePopup" />

      <div v-if="selectedImage && !selectedImage.loaded" class="h-64 w-full flex items-center justify-center">
        <div i-mingcute-loading-fill animate-spin text-4xl text-white />
      </div>

      <ZoomLens
        v-if="selectedImage"
        :src="selectedImage.url"
        :alt="selectedImage.pathname"
        :class="{ hidden: !selectedImage.loaded }"
      />

      <button mt-4 flex cursor-pointer items-center gap-1 border-0 rounded-md bg-blue-500 p-2 text-white hover:bg-blue-600 @click="downloadImage(selectedImage!)">
        <div i-mingcute:download-2-line />Download
      </button>
    </div>
    <button class="i-mingcute:arrow-right-circle-line absolute right-4 top-1/2 z-10 transform cursor-pointer text-3xl text-white -translate-y-1/2 hover:text-blue-300" @click="nextImage" />
  </div>
</template>
