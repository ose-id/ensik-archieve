<script setup lang="ts">
interface ImageItem {
  url: string;
  pathname: string;
  loaded: boolean;
  visible: boolean;
  element?: HTMLElement;
}

const images = ref<ImageItem[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);
const showPopup = ref(false);
const selectedImage = ref<ImageItem | null>(null);
const currentIndex = ref(0);
const observer = ref<IntersectionObserver | null>(null);

onMounted(async () => {
  try {
    const fetchedImages = await $fetch('/api/images');
    images.value = Array.isArray(fetchedImages)
      ? fetchedImages.map(img => ({ ...img, loaded: false, visible: false }))
      : [];

    // Initialize Intersection Observer for lazy loading
    setupIntersectionObserver();
  }
  catch (err) {
    console.error('Failed to fetch images:', err);
    error.value = 'Failed to load images.';
  }
  finally {
    isLoading.value = false;
  }
});

onUnmounted(() => {
  if (observer.value) {
    observer.value.disconnect();
  }
});

const getUsername = (pathname: string) => pathname.split('-')[0];

function handleImageLoaded(index: number) {
  if (index >= 0 && index < images.value.length) {
    const image = images.value[index];
    if (image) {
      image.loaded = true;
    }
  }
}

function setupIntersectionObserver() {
  if (import.meta.client) {
    observer.value = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number.parseInt(entry.target.getAttribute('data-index') || '0');
            const image = images.value[index];
            if (image && !image.visible) {
              image.visible = true;
            }
          }
        });
      },
      {
        root: null,
        rootMargin: '50px', // Load images 50px before they come into view
        threshold: 0.1,
      },
    );
  }
}

function observeImage(el: HTMLElement, index: number) {
  if (observer.value && el) {
    el.setAttribute('data-index', index.toString());
    observer.value.observe(el);
  }
}

function openPopup(image: ImageItem, index: number) {
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
    selectedImage.value = images.value[currentIndex.value] || null;
  }
}

function prevImage() {
  if (currentIndex.value > 0) {
    currentIndex.value--;
    selectedImage.value = images.value[currentIndex.value] || null;
  }
}

async function downloadImage(image: ImageItem) {
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
      <div i-mingcute-loading-fill animate-spin text-4xl text-neutral-900 dark:text-white />
    </div>
    <div v-else-if="error" rounded-lg bg-red-100 p-4 text-center text-red-500>
      {{ error }}
    </div>
    <div v-else-if="images.length === 0" rounded-lg bg-neutral-100 p-4 text-center text-neutral-500>
      No images uploaded yet.
    </div>

    <div v-else columns-2 gap-4 lg:columns-4 md:columns-3 xl:columns-5 space-y-4>
      <div
        v-for="(image, index) in images"
        :key="image.pathname"
        break-inside-avoid
      >
        <div
          :ref="(el) => observeImage(el as HTMLElement, index)"
          class="relative cursor-pointer overflow-hidden rounded-lg shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
          @click="openPopup(image, index)"
        >
          <div class="aspect-w-4 aspect-h-3 bg-neutral-100">
            <!-- Placeholder while image is not visible or loading -->
            <div
              v-if="!image.visible || !image.loaded"
              class="absolute inset-0 flex items-center justify-center bg-neutral-200 dark:bg-neutral-700"
            >
              <div v-if="image.visible && !image.loaded" i-mingcute-loading-fill animate-spin text-2xl text-neutral-500 />
              <div v-else class="text-neutral-400">
                <div i-mingcute:image-line text-4xl />
              </div>
            </div>

            <!-- Only render NuxtImg when image is visible -->
            <NuxtImg
              v-if="image.visible"
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
    <div class="relative max-w-3xl w-[60%] flex flex-col items-center rounded-lg bg-neutral-900/70 p-4 lg:w-full">
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
