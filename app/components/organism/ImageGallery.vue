<script setup vapor lang="ts">
import type { ArchiveImagePage } from '~~/shared/types/images';
import { breakpointsTailwind } from '@vueuse/core';

const PAGE_SIZE = 30;
const PRELOAD_MARGIN = 1_000;
const HIGH_QUALITY_WIDTHS = [320, 480, 640, 960, 1280, 1920];

// Vapor components can lose the Nuxt context after an `await`, so every
// composable is registered before the first page request is awaited below.
const { onArchiveChanged } = useArchiveEvents();
const breakpoints = useBreakpoints(breakpointsTailwind);
const { width: viewportWidth } = useWindowSize();
const columnCount = computed(() => {
  if (breakpoints.xl.value)
    return 5;
  if (breakpoints.lg.value)
    return 4;
  if (breakpoints.md.value)
    return 3;
  return 2;
});
const {
  append,
  columns,
  images,
  prepend,
  ratioOf,
  remove,
  reset,
  setMeasuredRatio,
} = useArchiveMasonry(columnCount);

const isMounted = shallowRef(false);
const isActive = shallowRef(true);
const selectedId = ref<string>();
const isLoadingMore = ref(false);
const paginationError = ref('');
const paginationSentinel = ref<HTMLElement>();
const cursor = ref<string | null>(null);
const hasMore = ref(false);
const sentinelVisible = useElementVisibility(paginationSentinel, {
  rootMargin: `${PRELOAD_MARGIN}px 0px`,
});

const pageRequest = useFetch<ArchiveImagePage>('/api/images', {
  key: 'archive-images',
  deep: false,
  query: { limit: PAGE_SIZE },
  watch: false,
});
const { data, error, refresh, status } = pageRequest;

const selectedIndex = computed(() => images.value.findIndex(image => image.id === selectedId.value));
const selectedImage = computed(() => images.value[selectedIndex.value]);
/** Grid images only need to be as wide as one column, not the 1920px viewer size. */
const highWidth = computed(() => {
  const pixelRatio = import.meta.client
    ? window.devicePixelRatio
    : 1;
  const target = (viewportWidth.value / columnCount.value) * pixelRatio;
  return HIGH_QUALITY_WIDTHS.find(width => width >= target) ?? 1920;
});

watch(data, applyFirstPage, { immediate: true });

watch(sentinelVisible, (visible) => {
  // The observer can report a stale intersection while KeepAlive re-inserts
  // the page, so confirm against the real layout before loading.
  if (visible && sentinelNearViewport())
    void loadMore();
});

watch(selectedImage, (image) => {
  if (import.meta.client)
    document.body.style.overflow = image ? 'hidden' : '';
});

onArchiveChanged((change) => {
  if (change.type === 'added')
    prepend(change.image);
  else
    remove(change.id);
});

onMounted(() => {
  isMounted.value = true;
});

onBeforeUnmount(() => {
  if (import.meta.client)
    document.body.style.overflow = '';
});

onActivated(() => {
  isActive.value = true;
  setArchiveImagePreloadingPaused(false);
});

onDeactivated(() => {
  isActive.value = false;
  setArchiveImagePreloadingPaused(true);
  selectedId.value = undefined;
  if (import.meta.client)
    document.body.style.overflow = '';
});

onKeyStroke('Escape', closeViewer);
onKeyStroke('ArrowRight', () => void nextImage());
onKeyStroke('ArrowLeft', previousImage);

await pageRequest;

function applyFirstPage(page: ArchiveImagePage | null | undefined) {
  reset(page?.items || []);
  cursor.value = page?.cursor || null;
  hasMore.value = page?.hasMore || false;
  paginationError.value = '';
  selectedId.value = undefined;
}

function sentinelNearViewport() {
  const sentinel = paginationSentinel.value;
  if (!isActive.value || !sentinel?.isConnected)
    return false;
  return sentinel.getBoundingClientRect().top < window.innerHeight + PRELOAD_MARGIN;
}

async function loadMore() {
  if (isLoadingMore.value || paginationError.value || !hasMore.value || !cursor.value)
    return;

  isLoadingMore.value = true;
  try {
    const page = await $fetch<ArchiveImagePage>('/api/images', {
      query: {
        cursor: cursor.value,
        limit: PAGE_SIZE,
      },
    });
    append(page.items);
    cursor.value = page.cursor;
    hasMore.value = page.hasMore;
  }
  catch {
    paginationError.value = 'Gagal memuat gambar berikutnya.';
  }
  finally {
    isLoadingMore.value = false;
  }

  // Every image reserves its space up front, so this only continues while the
  // viewport is genuinely not filled yet instead of chaining page after page.
  await nextTick();
  if (sentinelNearViewport())
    void loadMore();
}

function retryLoadMore() {
  paginationError.value = '';
  void loadMore();
}

function openViewer(id: string) {
  selectedId.value = id;
}

function closeViewer() {
  selectedId.value = undefined;
}

async function nextImage() {
  const index = selectedIndex.value;
  if (index === -1 || images.value.length < 2)
    return;

  if (index === images.value.length - 1 && hasMore.value)
    await loadMore();
  selectedId.value = images.value[(index + 1) % images.value.length]?.id;
}

function previousImage() {
  const index = selectedIndex.value;
  if (index === -1 || images.value.length < 2)
    return;

  selectedId.value = images.value[(index - 1 + images.value.length) % images.value.length]?.id;
}

function reloadImages() {
  void refresh();
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
</script>

<template>
  <section aria-label="Galeri Ensik Archive">
    <div
      v-if="!isMounted || (status === 'pending' && images.length === 0)"
      class="flex items-start gap-3"
      aria-label="Memuat galeri"
    >
      <div
        v-for="column in 5"
        :key="column"
        class="min-w-0 flex-1 flex-col gap-3"
        :class="[
          column > 2 ? 'hidden' : 'flex',
          column === 3 ? 'md:flex' : '',
          column === 4 ? 'lg:flex' : '',
          column === 5 ? 'xl:flex' : '',
        ]"
      >
        <div
          v-for="row in 3"
          :key="row"
          class="animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-800"
          :class="(row + column) % 3 === 0
            ? 'h-72'
            : (row + column) % 2 === 0
              ? 'h-48'
              : 'h-60'"
        />
      </div>
    </div>

    <div
      v-else-if="error && images.length === 0"
      class="mx-auto max-w-md flex flex-col items-center border border-neutral-200 rounded-2xl border-solid bg-white px-6 py-10 text-center dark:border-neutral-800 dark:bg-neutral-900"
      role="alert"
    >
      <span class="h-12 w-12 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-950/50" aria-hidden="true">
        <span class="i-mingcute:wifi-off-line text-2xl text-red-600 dark:text-red-400" />
      </span>
      <h2 class="mb-1 mt-4 text-base text-neutral-900 font-semibold dark:text-white">
        Galeri gagal dimuat
      </h2>
      <p class="mb-5 mt-0 text-sm text-neutral-500 dark:text-neutral-400">
        Periksa koneksi lalu coba lagi.
      </p>
      <AtomsButton variant="primary" :loading="status === 'pending'" @click="reloadImages">
        <span v-if="status !== 'pending'" class="i-mingcute:refresh-2-line mr-2 text-base" aria-hidden="true" />
        Muat ulang
      </AtomsButton>
    </div>

    <div v-else-if="images.length === 0" class="rounded-lg bg-neutral-100 p-8 text-center text-neutral-500 dark:bg-neutral-900">
      Belum ada gambar di arsip.
    </div>

    <div v-else class="flex items-start gap-3">
      <div
        v-for="(column, columnIndex) in columns"
        :key="columnIndex"
        class="min-w-0 flex flex-1 flex-col gap-3"
      >
        <button
          v-for="(image, row) in column"
          :key="image.id"
          type="button"
          class="[content-visibility:auto] relative block w-full cursor-pointer overflow-hidden border-0 rounded-lg bg-neutral-100 p-0 shadow-md dark:bg-neutral-900 focus-visible:outline-2 focus-visible:outline-blue-500"
          :style="{ aspectRatio: `1 / ${ratioOf(image)}` }"
          :aria-label="`Buka ${image.name}`"
          @click="openViewer(image.id)"
        >
          <MoleculesProgressiveArchiveImage
            :src="image.id"
            sizes="xs:50vw md:33vw lg:25vw xl:20vw"
            :loading="row < 2 ? 'eager' : 'lazy'"
            :high-width="highWidth"
            :high-quality="80"
            image-class="block h-full w-full object-cover"
            class="h-full w-full"
            @dimensions="setMeasuredRatio(image, $event)"
          />
        </button>
      </div>
    </div>

    <div
      v-if="isMounted && images.length > 0"
      ref="paginationSentinel"
      class="min-h-20 flex flex-col items-center justify-center gap-2 py-6"
      aria-live="polite"
    >
      <template v-if="paginationError">
        <p class="m-0 text-sm text-red-600 dark:text-red-400">
          {{ paginationError }}
        </p>
        <AtomsButton variant="secondary" @click="retryLoadMore">
          Coba lagi
        </AtomsButton>
      </template>
      <span v-else-if="isLoadingMore || hasMore" class="i-mingcute:loading-fill animate-spin text-2xl text-neutral-400" aria-label="Memuat gambar berikutnya" />
      <template v-else>
        <p class="m-0 text-sm text-neutral-500 dark:text-neutral-400">
          Kamu sudah melihat seluruh arsip · {{ images.length }} gambar
        </p>
        <AtomsButton variant="ghost" size="sm" @click="scrollToTop">
          <span class="i-mingcute:arrow-up-line mr-1" aria-hidden="true" />
          Kembali ke atas
        </AtomsButton>
      </template>
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
        v-if="images.length > 1"
        direction="left"
        class="absolute left-2 z-20 md:left-6 !text-white"
        @click="previousImage"
      />
      <MoleculesZoomLens
        :key="selectedImage.id"
        :src="selectedImage.id"
        :alt="`Pratinjau ${selectedImage.name}`"
      />
      <AtomsArrowButton
        v-if="images.length > 1"
        direction="right"
        class="absolute right-2 z-20 md:right-6 !text-white"
        @click="nextImage"
      />
    </div>
  </Teleport>
</template>
