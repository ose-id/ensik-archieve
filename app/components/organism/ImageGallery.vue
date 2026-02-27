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
    const fetchedImages = (await $fetch('/api/images')) as any[];

    // Shuffle the array for randomized order
    const shuffledImages = Array.isArray(fetchedImages)
      ? [...fetchedImages].sort(() => Math.random() - 0.5)
      : [];

    images.value = shuffledImages.map((img: any) => ({ ...img, loaded: false, visible: false }));

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

watch(showPopup, (isShowing) => {
  if (import.meta.client) {
    if (isShowing) {
      document.body.style.overflow = 'hidden';
    }
    else {
      document.body.style.overflow = '';
    }
  }
});

function nextImage() {
  if (images.value.length === 0)
    return;
  currentIndex.value = (currentIndex.value + 1) % images.value.length;
  selectedImage.value = images.value[currentIndex.value] || null;
}

function prevImage() {
  if (images.value.length === 0)
    return;
  currentIndex.value = (currentIndex.value - 1 + images.value.length) % images.value.length;
  selectedImage.value = images.value[currentIndex.value] || null;
}
</script>

<template>
  <div mx-auto pb-12>
    <div v-if="isLoading" columns-2 gap-4 lg:columns-4 md:columns-3 xl:columns-5 space-y-4>
      <div v-for="i in 10" :key="i" break-inside-avoid>
        <div class="relative overflow-hidden rounded-lg shadow-lg">
          <div class="aspect-w-4 aspect-h-3 animate-pulse bg-neutral-200 dark:bg-neutral-700" />
        </div>
      </div>
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
              class="absolute inset-0 bg-neutral-200 dark:bg-neutral-700"
              :class="{ 'animate-pulse': image.visible && !image.loaded }"
            />

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
        </div>
      </div>
    </div>
  </div>

  <div
    v-if="showPopup"
    class="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 p-2 backdrop-blur-sm sm:p-6"
    @click.self="closePopup"
  >
    <!-- Top Bar -->
    <div class="absolute left-0 right-0 top-0 z-[110] flex items-center justify-end gap-2 p-4 pt-4 sm:pr-6 sm:pt-6">
      <AtomsCloseButton
        class="!text-neutral-300 hover:!text-white"
        @click="closePopup"
      />
    </div>

    <!-- Main Content Area -->
    <div class="pointer-events-none relative max-w-7xl min-h-0 w-full flex flex-1 items-center justify-center">
      <!-- Previous Button (Left) -->
      <div class="pointer-events-auto absolute left-0 z-[110] lg:-left-16 md:-left-8 sm:-left-2">
        <AtomsArrowButton
          v-if="images.length > 1"
          direction="left"
          class="!text-white hover:!text-blue-400"
          @click.stop="prevImage"
        />
      </div>

      <!-- Image Display -->
      <div
        class="pointer-events-auto relative max-h-full w-full flex items-center justify-center transition-transform duration-300"
        @click.stop
      >
        <div v-if="selectedImage && !selectedImage.loaded" class="absolute inset-0 flex items-center justify-center">
          <div i-mingcute-loading-fill animate-spin text-4xl text-neutral-400 />
        </div>

        <MoleculesZoomLens
          v-if="selectedImage"
          :src="selectedImage.url"
          :alt="selectedImage.pathname"
          class="transition-opacity duration-300"
          :class="{ 'opacity-0': !selectedImage.loaded, 'opacity-100': selectedImage.loaded }"
        />
      </div>

      <!-- Next Button (Right) -->
      <div class="pointer-events-auto absolute right-0 z-[110] lg:-right-16 md:-right-8 sm:-right-2">
        <AtomsArrowButton
          v-if="images.length > 1"
          direction="right"
          class="!text-white hover:!text-blue-400"
          @click.stop="nextImage"
        />
      </div>
    </div>
  </div>
</template>
