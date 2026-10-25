<script setup vapor lang="ts">
import type { ArchiveImage, ArchiveImagePage } from '~~/shared/types/images';

const PAGE_SIZE = 30;
const PRELOAD_MARGIN = 1_000;

// Vapor components can lose the Nuxt context after an `await`, so every
// composable is registered before the first page request is awaited below.
const { onArchiveChanged } = useArchiveEvents();
// A new random order on every page load. `useState` carries the seed from SSR
// to hydration so both render the same first page.
const baseSeed = useState('archive-gallery-seed', () => Math.floor(Math.random() * 0x1_0000_0000));
const { columnCount, highWidth } = useArchiveColumns();
const {
  append,
  columns,
  items,
  prepend,
  ratioOf,
  removeImage,
  reset,
  setMeasuredRatio,
} = useArchiveMasonry(columnCount);

const isMounted = shallowRef(false);
const isActive = shallowRef(true);
const selectedKey = ref<string>();
const isLoadingMore = ref(false);
const paginationError = ref('');
const paginationSentinel = ref<HTMLElement>();
const cursor = ref<string | null>(null);
/** Each pass through the whole archive is one cycle with its own shuffle. */
let cycle = 0;
const sentinelVisible = useElementVisibility(paginationSentinel, {
  rootMargin: `${PRELOAD_MARGIN}px 0px`,
});

const pageRequest = useFetch<ArchiveImagePage>('/api/images', {
  key: 'archive-images',
  deep: false,
  query: { limit: PAGE_SIZE, seed: baseSeed.value },
  watch: false,
});
const { data, error, refresh, status } = pageRequest;

watch(data, applyFirstPage, { immediate: true });

watch(sentinelVisible, (visible) => {
  // The observer can report a stale intersection while KeepAlive re-inserts
  // the page, so confirm against the real layout before loading.
  if (visible && sentinelNearViewport())
    void loadMore();
});

onArchiveChanged((change) => {
  if (change.type === 'added')
    prepend({ image: change.image, key: `added:${change.image.id}` });
  else
    removeImage(change.id);
});

onMounted(() => {
  isMounted.value = true;
});

onActivated(() => {
  isActive.value = true;
  setArchiveImagePreloadingPaused(false);
});

onDeactivated(() => {
  isActive.value = false;
  setArchiveImagePreloadingPaused(true);
  selectedKey.value = undefined;
});

await pageRequest;

function seedForCycle(value: number) {
  return (baseSeed.value + Math.imul(value, 0x9E3779B9)) >>> 0;
}

function toItems(images: ArchiveImage[]) {
  return images.map(image => ({ image, key: `${cycle}:${image.id}` }));
}

function applyFirstPage(page: ArchiveImagePage | null | undefined) {
  cycle = 0;
  reset(toItems(page?.items || []));
  cursor.value = page?.cursor || null;
  paginationError.value = '';
  selectedKey.value = undefined;
}

function sentinelNearViewport() {
  const sentinel = paginationSentinel.value;
  if (!isActive.value || !sentinel?.isConnected)
    return false;
  return sentinel.getBoundingClientRect().top < window.innerHeight + PRELOAD_MARGIN;
}

/**
 * Loads the next page of the current shuffle. When a cycle runs out, the next
 * one starts from the top with a different seed, so the gallery never ends.
 */
async function loadMore() {
  if (isLoadingMore.value || paginationError.value || !items.value.length)
    return;

  isLoadingMore.value = true;
  try {
    const nextCycle = cursor.value
      ? cycle
      : cycle + 1;
    const page = await $fetch<ArchiveImagePage>('/api/images', {
      query: {
        cursor: cursor.value ?? undefined,
        limit: PAGE_SIZE,
        seed: seedForCycle(nextCycle),
      },
    });

    const pageImages = [...page.items];
    // Don't let a new cycle start with the image the previous one ended on.
    const lastImageId = items.value.at(-1)?.image.id;
    if (nextCycle !== cycle && pageImages.length > 1 && pageImages[0]?.id === lastImageId)
      pageImages.push(pageImages.shift()!);

    cycle = nextCycle;
    append(toItems(pageImages));
    cursor.value = page.cursor;
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

function openViewer(key: string) {
  selectedKey.value = key;
}

function reloadImages() {
  void refresh();
}
</script>

<template>
  <section aria-label="Galeri Ensik Archive">
    <MoleculesMasonrySkeleton
      v-if="!isMounted || (status === 'pending' && items.length === 0)"
      aria-label="Memuat galeri"
    />

    <div
      v-else-if="error && items.length === 0"
      class="mx-auto px-6 py-10 text-center border border-neutral-200 rounded-2xl bg-white flex flex-col max-w-md items-center dark:border-neutral-800 dark:bg-neutral-900"
      role="alert"
    >
      <span class="rounded-full bg-red-100 flex h-12 w-12 items-center justify-center dark:bg-red-950/50" aria-hidden="true">
        <span class="i-mingcute:wifi-off-line text-2xl text-red-600 dark:text-red-400" />
      </span>
      <h2 class="text-base text-strong font-semibold mb-1 mt-4">
        Galeri gagal dimuat
      </h2>
      <p class="text-sm text-muted mb-5">
        Periksa koneksi lalu coba lagi.
      </p>
      <AtomsButton variant="primary" :loading="status === 'pending'" @click="reloadImages">
        <span v-if="status !== 'pending'" class="i-mingcute:refresh-2-line text-base mr-2" aria-hidden="true" />
        Muat ulang
      </AtomsButton>
    </div>

    <div v-else-if="items.length === 0" class="text-neutral-500 p-8 text-center rounded-lg bg-neutral-100 dark:bg-neutral-900">
      Belum ada gambar di arsip.
    </div>

    <div v-else class="flex gap-3 items-start">
      <div
        v-for="(column, columnIndex) in columns"
        :key="columnIndex"
        class="flex flex-1 flex-col gap-3 min-w-0"
      >
        <button
          v-for="(item, row) in column"
          :key="item.key"
          type="button"
          class="group rounded-2xl bg-neutral-100 w-full block cursor-zoom-in [content-visibility:auto] relative overflow-hidden focus-visible:(outline-2 outline-neutral-900 outline-offset-2) dark:(bg-neutral-900 focus-visible:outline-white)"
          :style="{ aspectRatio: `1 / ${ratioOf(item.image)}` }"
          :aria-label="`Buka ${item.image.name}`"
          @click="openViewer(item.key)"
        >
          <MoleculesProgressiveArchiveImage
            :src="item.image.id"
            sizes="xs:50vw md:33vw lg:25vw xl:20vw"
            :loading="row < 2 ? 'eager' : 'lazy'"
            :high-width="highWidth"
            :high-quality="80"
            image-class="block h-full w-full object-cover"
            class="h-full w-full"
            @dimensions="setMeasuredRatio(item.image, $event)"
          />
          <span class="tile-dim" aria-hidden="true" />
        </button>
      </div>
    </div>

    <div
      v-if="isMounted && items.length > 0"
      ref="paginationSentinel"
      class="py-6 flex flex-col gap-2 min-h-20 items-center justify-center"
      aria-live="polite"
    >
      <template v-if="paginationError">
        <p class="text-sm text-red-600 dark:text-red-400">
          {{ paginationError }}
        </p>
        <AtomsButton variant="secondary" @click="retryLoadMore">
          Coba lagi
        </AtomsButton>
      </template>
      <span v-else class="i-mingcute:loading-fill text-2xl text-neutral-400 animate-spin" aria-label="Memuat gambar berikutnya" />
    </div>
  </section>

  <OrganismImageViewer v-model:selected-key="selectedKey" :items="items" :load-more="loadMore" />
</template>
