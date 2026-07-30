<script setup lang="ts">
import type { ArchiveImage, ArchiveImagePage } from '~~/shared/types/images';

interface GalleryItem {
  image: ArchiveImage;
  renderKey: string;
}

const LOOP_BATCH_SIZE = 24;
const PAGE_SIZE = 30;
const { revision } = useArchiveEvents();
const selectedIndex = ref<number>();
const isLoadingMore = ref(false);
const paginationError = ref('');
const paginationSentinel = ref<HTMLElement>();
const sentinelVisible = ref(false);
let continuationFrame = 0;
let isExtendingLoop = false;
let loopCycle = 0;
let loopQueue: GalleryItem[] = [];
let previousCycleIds: string[] = [];

const {
  data,
  error,
  refresh,
  status,
} = await useFetch<ArchiveImagePage>('/api/images', {
  key: 'archive-images',
  deep: false,
  query: { limit: PAGE_SIZE },
  watch: false,
});

const initialImages = data.value?.items || [];
const archiveImages = shallowRef<ArchiveImage[]>(initialImages);
const galleryItems = shallowRef<GalleryItem[]>(initialImages.map(image => ({
  image,
  renderKey: `source-${image.id}`,
})));
const cursor = ref<string | null>(data.value?.cursor || null);
const hasMore = ref(data.value?.hasMore || false);
const selectedImage = computed(() => (
  selectedIndex.value === undefined
    ? undefined
    : galleryItems.value[selectedIndex.value]?.image
));

watch(data, (page) => {
  resetGallery(page);
});

watch(revision, () => {
  void refresh();
});

watch(selectedImage, (image) => {
  if (import.meta.client)
    document.body.style.overflow = image ? 'hidden' : '';
});

onBeforeUnmount(() => {
  if (continuationFrame)
    cancelAnimationFrame(continuationFrame);
  if (import.meta.client)
    document.body.style.overflow = '';
});

onActivated(() => {
  setArchiveImagePreloadingPaused(false);
});

onDeactivated(() => {
  setArchiveImagePreloadingPaused(true);
  sentinelVisible.value = false;
  selectedIndex.value = undefined;
  if (import.meta.client)
    document.body.style.overflow = '';
});

onKeyStroke('Escape', closeViewer);
onKeyStroke('ArrowRight', nextImage);
onKeyStroke('ArrowLeft', previousImage);

useIntersectionObserver(
  paginationSentinel,
  ([entry]) => {
    sentinelVisible.value = Boolean(entry?.isIntersecting);
    if (sentinelVisible.value)
      void loadMore();
  },
  { rootMargin: '800px 0px' },
);

function openViewer(index: number) {
  selectedIndex.value = index;
}

function closeViewer() {
  selectedIndex.value = undefined;
}

function nextImage() {
  if (selectedIndex.value === undefined || galleryItems.value.length < 2)
    return;
  selectedIndex.value = (selectedIndex.value + 1) % galleryItems.value.length;
}

function previousImage() {
  if (selectedIndex.value === undefined || galleryItems.value.length < 2)
    return;
  selectedIndex.value = (
    selectedIndex.value - 1 + galleryItems.value.length
  ) % galleryItems.value.length;
}

async function loadMore() {
  if (isLoadingMore.value || isExtendingLoop)
    return;

  if (!cursor.value || !hasMore.value) {
    await extendLoop();
    return;
  }

  isLoadingMore.value = true;
  paginationError.value = '';
  try {
    const page = await $fetch<ArchiveImagePage>('/api/images', {
      query: {
        cursor: cursor.value,
        limit: PAGE_SIZE,
      },
    });
    appendArchiveImages(page.items);
    cursor.value = page.cursor;
    hasMore.value = page.hasMore;
  }
  catch {
    paginationError.value = 'Gagal memuat gambar berikutnya.';
  }
  finally {
    isLoadingMore.value = false;
    await nextTick();
    scheduleContinuation();
  }
}

function appendArchiveImages(items: ArchiveImage[]) {
  const knownIds = new Set(archiveImages.value.map(image => image.id));
  const uniqueItems = items.filter(image => !knownIds.has(image.id));
  if (!uniqueItems.length)
    return;

  archiveImages.value = [...archiveImages.value, ...uniqueItems];
  galleryItems.value = [
    ...galleryItems.value,
    ...uniqueItems.map(image => ({
      image,
      renderKey: `source-${image.id}`,
    })),
  ];
  loopQueue = [];
  previousCycleIds = [];
}

function resetGallery(page: ArchiveImagePage | null | undefined) {
  const items = page?.items || [];
  archiveImages.value = items;
  galleryItems.value = items.map(image => ({
    image,
    renderKey: `source-${image.id}`,
  }));
  cursor.value = page?.cursor || null;
  hasMore.value = page?.hasMore || false;
  paginationError.value = '';
  selectedIndex.value = undefined;
  loopCycle = 0;
  loopQueue = [];
  previousCycleIds = [];
}

function shuffleImages(items: ArchiveImage[]) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex]!, shuffled[index]!];
  }

  const ids = shuffled.map(image => image.id);
  const repeatsPreviousOrder = ids.length > 1
    && ids.every((id, index) => id === previousCycleIds[index]);
  if (repeatsPreviousOrder)
    shuffled.push(shuffled.shift()!);

  const lastImageId = galleryItems.value.at(-1)?.image.id;
  if (shuffled.length > 1 && shuffled[0]?.id === lastImageId) {
    const swapIndex = shuffled.findIndex(image => image.id !== lastImageId);
    [shuffled[0], shuffled[swapIndex]] = [shuffled[swapIndex]!, shuffled[0]!];
  }

  previousCycleIds = shuffled.map(image => image.id);
  return shuffled;
}

function refillLoopQueue() {
  loopCycle += 1;
  loopQueue = shuffleImages(archiveImages.value).map((image, index) => ({
    image,
    renderKey: `loop-${loopCycle}-${index}-${image.id}`,
  }));
}

async function extendLoop() {
  if (!archiveImages.value.length || paginationError.value)
    return;

  isExtendingLoop = true;
  if (!loopQueue.length)
    refillLoopQueue();

  const batchSize = Math.min(LOOP_BATCH_SIZE, loopQueue.length);
  galleryItems.value = [
    ...galleryItems.value,
    ...loopQueue.splice(0, batchSize),
  ];
  await nextTick();
  isExtendingLoop = false;
  scheduleContinuation();
}

function scheduleContinuation() {
  if (
    continuationFrame
    || !sentinelVisible.value
    || paginationError.value
  ) {
    return;
  }

  continuationFrame = requestAnimationFrame(() => {
    continuationFrame = 0;
    if (sentinelVisible.value)
      void loadMore();
  });
}

function reloadImages() {
  void refresh();
}
</script>

<template>
  <section aria-label="Galeri Ensik Archive">
    <div
      v-if="status === 'pending' && archiveImages.length === 0"
      class="columns-2 gap-3 lg:columns-4 md:columns-3 xl:columns-5"
      aria-label="Memuat galeri"
    >
      <div
        v-for="index in 10"
        :key="index"
        class="mb-3 animate-pulse break-inside-avoid rounded-lg bg-neutral-200 dark:bg-neutral-800"
        :class="index % 3 === 0 ? 'h-72' : index % 2 === 0 ? 'h-48' : 'h-60'"
      />
    </div>

    <div v-else-if="error && archiveImages.length === 0" class="rounded-lg bg-red-50 p-5 text-center text-red-700 dark:bg-red-950/40 dark:text-red-300">
      Galeri gagal dimuat. Silakan coba lagi.
      <AtomsButton variant="outline" size="sm" class="ml-2" @click="reloadImages">
        Muat ulang
      </AtomsButton>
    </div>

    <div v-else-if="archiveImages.length === 0" class="rounded-lg bg-neutral-100 p-8 text-center text-neutral-500 dark:bg-neutral-900">
      Belum ada gambar di arsip.
    </div>

    <div v-else class="columns-2 gap-3 lg:columns-4 md:columns-3 xl:columns-5">
      <button
        v-for="(item, index) in galleryItems"
        :key="item.renderKey"
        v-memo="[item.renderKey]"
        type="button"
        class="relative mb-3 block w-full cursor-pointer break-inside-avoid overflow-hidden border-0 rounded-lg bg-neutral-100 p-0 shadow-md dark:bg-neutral-900 focus-visible:outline-2 focus-visible:outline-blue-500"
        :aria-label="`Buka ${item.image.name}`"
        @click="openViewer(index)"
      >
        <MoleculesProgressiveArchiveImage
          :src="item.image.id"
          sizes="xs:50vw md:33vw lg:25vw xl:20vw"
          :loading="index < 6 ? 'eager' : 'lazy'"
          class="w-full"
        />
      </button>
    </div>

    <div
      v-if="galleryItems.length > 0"
      ref="paginationSentinel"
      class="min-h-20 flex flex-col items-center justify-center gap-2"
      aria-live="polite"
    >
      <p v-if="paginationError" class="m-0 text-sm text-red-600 dark:text-red-400">
        {{ paginationError }}
      </p>
      <span v-else-if="isLoadingMore" class="i-mingcute:loading-fill animate-spin text-2xl text-neutral-400" aria-label="Memuat gambar berikutnya" />
      <AtomsButton v-if="paginationError" variant="secondary" @click="loadMore">
        Coba lagi
      </AtomsButton>
    </div>
  </section>

  <Teleport to="body">
    <div
      v-if="selectedImage"
      class="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-3 backdrop-blur-sm md:p-8"
      role="dialog"
      aria-modal="true"
      :aria-label="`Pratinjau ${selectedImage.name}`"
      @click.self="closeViewer"
    >
      <AtomsCloseButton
        class="absolute right-3 top-3 z-20 md:right-6 md:top-6 !text-white"
        @click="closeViewer"
      />
      <AtomsArrowButton
        v-if="galleryItems.length > 1"
        direction="left"
        class="absolute left-2 z-20 md:left-6 !text-white"
        @click.stop="previousImage"
      />
      <MoleculesZoomLens
        :key="selectedImage.id"
        :src="selectedImage.id"
        :alt="`Pratinjau ${selectedImage.name}`"
      />
      <AtomsArrowButton
        v-if="galleryItems.length > 1"
        direction="right"
        class="absolute right-2 z-20 md:right-6 !text-white"
        @click.stop="nextImage"
      />
    </div>
  </Teleport>
</template>
