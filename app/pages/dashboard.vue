<script setup vapor lang="ts">
import type { ArchiveImage, ArchiveImagePage, ArchiveSortOrder } from '~~/shared/types/images';

definePageMeta({
  middleware: 'auth',
});

useSeoMeta({
  title: 'Dashboard - Ensik Archive',
});

const PAGE_SIZE = 30;
const PRELOAD_MARGIN = 600;
const FILE_SIZE_UNITS = ['B', 'KB', 'MB', 'GB'];
const SORT_OPTIONS: { label: string; value: ArchiveSortOrder }[] = [
  { label: 'Terbaru', value: 'desc' },
  { label: 'Terlama', value: 'asc' },
];
const VIEW_OPTIONS: { icon: string; label: string; value: 'card' | 'list' }[] = [
  { icon: 'i-mingcute:list-check-line', label: 'Tampilan daftar', value: 'list' },
  { icon: 'i-mingcute:grid-line', label: 'Tampilan kartu', value: 'card' },
];
const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
});
const { addToast } = useToast();
const { notifyArchiveChanged, onArchiveChanged } = useArchiveEvents();
const viewMode = ref<'card' | 'list'>('list');
const sortOrder = useCookie<ArchiveSortOrder>('ensik-dashboard-sort', {
  default: () => 'desc',
  sameSite: 'lax',
});
const deleteCandidate = ref<ArchiveImage>();
const deletingImageId = ref('');
const loadingMore = ref(false);
const paginationError = ref('');
const paginationSentinel = ref<HTMLElement>();
const sentinelVisible = useElementVisibility(paginationSentinel, {
  rootMargin: `${PRELOAD_MARGIN}px 0px`,
});
const images = shallowRef<ArchiveImage[]>([]);
const cursor = ref<string | null>(null);
const hasMore = ref(false);
const total = ref(0);
const totalSize = ref(0);

const isMounted = shallowRef(false);

// Sorting happens on the server across every upload, so changing the order
// refetches the first page instead of re-sorting only what is loaded.
// Private, per-user data is fetched on the client only: Vapor components can't
// make SSR wait for it, and rendering a different branch on the server than on
// the client breaks hydration of the v-if chain below.
const {
  data,
  error,
  refresh,
  status,
} = useFetch<ArchiveImagePage>('/api/user-images', {
  key: 'user-archive-images',
  deep: false,
  server: false,
  query: computed(() => ({ limit: PAGE_SIZE, order: sortOrder.value })),
});

/** Nothing usable to show yet: before mount (matches SSR) or while the first page loads. */
const isInitialLoading = computed(() => !isMounted.value
  || (!images.value.length && (status.value === 'idle' || status.value === 'pending')));

const summary = computed(() => {
  if (isInitialLoading.value)
    return 'Memuat foto…';
  if (!images.value.length && error.value)
    return 'Foto tidak dapat dimuat';
  if (!total.value)
    return 'Belum ada foto';
  if (images.value.length < total.value)
    return `${images.value.length} dari ${total.value} foto dimuat`;
  return `${total.value} foto`;
});

watch(data, applyFirstPage, { immediate: true });

onMounted(() => {
  isMounted.value = true;
});

watch(sentinelVisible, (visible) => {
  if (visible && sentinelNearViewport())
    void loadMore();
});

onArchiveChanged((change) => {
  if (change.type === 'added') {
    total.value += 1;
    totalSize.value += change.image.size;
    if (sortOrder.value === 'desc')
      images.value = [change.image, ...images.value];
    else if (!hasMore.value)
      images.value = [...images.value, change.image];
    return;
  }

  const removed = images.value.find(image => image.id === change.id);
  if (!removed)
    return;

  images.value = images.value.filter(image => image.id !== change.id);
  total.value = Math.max(0, total.value - 1);
  totalSize.value = Math.max(0, totalSize.value - removed.size);
});

function applyFirstPage(page: ArchiveImagePage | null | undefined) {
  images.value = page?.items || [];
  cursor.value = page?.cursor || null;
  hasMore.value = page?.hasMore || false;
  total.value = page?.total || 0;
  totalSize.value = page?.totalSize || 0;
  paginationError.value = '';
}

function sentinelNearViewport() {
  const top = paginationSentinel.value?.getBoundingClientRect().top;
  return top !== undefined && top < window.innerHeight + PRELOAD_MARGIN;
}

async function loadMore() {
  if (loadingMore.value || paginationError.value || !hasMore.value || !cursor.value)
    return;

  const order = sortOrder.value;
  loadingMore.value = true;
  try {
    const page = await $fetch<ArchiveImagePage>('/api/user-images', {
      query: {
        cursor: cursor.value,
        limit: PAGE_SIZE,
        order,
      },
    });
    // Ignore a page that belongs to the previous sort order.
    if (order !== sortOrder.value)
      return;

    const known = new Set(images.value.map(image => image.id));
    images.value = [
      ...images.value,
      ...page.items.filter(image => !known.has(image.id)),
    ];
    cursor.value = page.cursor;
    hasMore.value = page.hasMore;
  }
  catch {
    paginationError.value = 'Gagal memuat gambar berikutnya.';
  }
  finally {
    loadingMore.value = false;
  }

  await nextTick();
  if (sentinelNearViewport())
    void loadMore();
}

function retryLoadMore() {
  paginationError.value = '';
  void loadMore();
}

async function deleteImage() {
  const image = deleteCandidate.value;
  if (!image || deletingImageId.value)
    return;

  deletingImageId.value = image.id;
  try {
    await $fetch('/api/delete-image', {
      method: 'DELETE',
      body: {
        etag: image.etag,
        id: image.id,
      },
    });
    deleteCandidate.value = undefined;
    notifyArchiveChanged({ type: 'removed', id: image.id });
    addToast('Gambar berhasil dihapus.', 'success');
  }
  catch {
    addToast('Gambar gagal dihapus. Muat ulang lalu coba lagi.', 'error');
  }
  finally {
    deletingImageId.value = '';
  }
}

function formatFileSize(bytes: number) {
  if (!bytes)
    return '0 B';

  const unit = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    FILE_SIZE_UNITS.length - 1,
  );
  return `${(bytes / 1024 ** unit).toFixed(unit === 0
    ? 0
    : 1)} ${FILE_SIZE_UNITS[unit]}`;
}

function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
}

function getDownloadUrl(id: string) {
  return `/api/media/${encodeURIComponent(id)}?download=1`;
}

function reloadImages() {
  void refresh();
}
</script>

<template>
  <div class="mx-auto py-4 max-w-[1600px] md:py-8">
    <section class="mb-6 gap-3 grid grid-cols-2 lg:mb-10 lg:gap-8 sm:gap-6" aria-label="Ringkasan arsip">
      <article class="p-4 rounded-xl shadow-lg relative overflow-hidden from-neutral-50 to-neutral-100 bg-gradient-to-br lg:p-8 sm:p-6 sm:rounded-2xl dark:from-neutral-900/20 dark:to-neutral-800/30">
        <div class="flex gap-2 items-center justify-between relative z-1">
          <div class="flex-1 min-w-0">
            <p class="text-2xs text-neutral-600 tracking-wide font-semibold truncate uppercase sm:text-sm dark:text-neutral-400">
              Total foto
            </p>
            <p class="text-2xl text-neutral-900 font-bold mt-1 lg:text-4xl sm:text-3xl dark:text-neutral-100 sm:mt-2">
              {{ total }}
            </p>
          </div>
          <div class="p-2 rounded-xl bg-neutral-600 shrink-0 hidden shadow-lg lg:p-4 sm:p-3 sm:rounded-2xl dark:bg-neutral-700 sm:block">
            <span class="i-mingcute:pic-line text-xl text-white block lg:text-3xl sm:text-2xl" aria-hidden="true" />
          </div>
        </div>
        <span class="rounded-full bg-neutral-200/50 h-12 w-12 absolute dark:bg-neutral-700/30 lg:h-20 lg:w-20 sm:h-16 sm:w-16 -bottom-2 -right-2" aria-hidden="true" />
      </article>

      <article class="p-4 rounded-xl shadow-lg relative overflow-hidden from-neutral-50 to-neutral-100 bg-gradient-to-br lg:p-8 sm:p-6 sm:rounded-2xl dark:from-neutral-900/20 dark:to-neutral-800/30">
        <div class="flex gap-2 items-center justify-between relative z-1">
          <div class="flex-1 min-w-0">
            <p class="text-2xs text-neutral-600 tracking-wide font-semibold truncate uppercase sm:text-sm dark:text-neutral-400">
              Total ukuran
            </p>
            <p class="text-2xl text-neutral-900 font-bold mt-1 truncate lg:text-4xl sm:text-3xl dark:text-neutral-100 sm:mt-2">
              {{ formatFileSize(totalSize) }}
            </p>
          </div>
          <div class="p-2 rounded-xl bg-neutral-600 shrink-0 hidden shadow-lg lg:p-4 sm:p-3 sm:rounded-2xl dark:bg-neutral-700 sm:block">
            <span class="i-mingcute:storage-line text-xl text-white block lg:text-3xl sm:text-2xl" aria-hidden="true" />
          </div>
        </div>
        <span class="rounded-full bg-neutral-200/50 h-12 w-12 absolute dark:bg-neutral-700/30 lg:h-20 lg:w-20 sm:h-16 sm:w-16 -bottom-2 -right-2" aria-hidden="true" />
      </article>
    </section>

    <section class="rounded-xl bg-white shadow-xl overflow-hidden sm:rounded-2xl dark:bg-neutral-800/50" aria-labelledby="user-images-title">
      <header class="p-4 border-b border-neutral-200/60 lg:p-8 sm:p-6 dark:border-neutral-700/50">
        <div class="flex flex-wrap gap-x-4 gap-y-3 items-end justify-between">
          <div class="min-w-0">
            <h1 id="user-images-title" class="text-lg text-neutral-900 font-bold lg:text-2xl sm:text-xl dark:text-white">
              Foto Anda
            </h1>
            <p class="text-xs text-neutral-500 mt-1 sm:text-sm dark:text-neutral-400">
              {{ summary }}
            </p>
          </div>

          <!-- One row on every width: sort on the left, view mode on the right. -->
          <div class="flex gap-2 w-full items-center justify-between sm:gap-3 sm:w-auto sm:justify-end">
            <div class="segmented" role="group" aria-label="Urutkan foto">
              <button
                v-for="option in SORT_OPTIONS"
                :key="option.value"
                type="button"
                class="text-xs font-medium px-3 segmented-item sm:text-sm"
                :class="sortOrder === option.value
                  ? 'segmented-item-active'
                  : 'segmented-item-idle'"
                :aria-pressed="sortOrder === option.value"
                @click="sortOrder = option.value"
              >
                {{ option.label }}
              </button>
            </div>

            <div class="segmented" role="group" aria-label="Mode tampilan">
              <button
                v-for="option in VIEW_OPTIONS"
                :key="option.value"
                type="button"
                class="segmented-item flex w-9 items-center justify-center"
                :class="viewMode === option.value
                  ? 'segmented-item-active'
                  : 'segmented-item-idle'"
                :title="option.label"
                :aria-label="option.label"
                :aria-pressed="viewMode === option.value"
                @click="viewMode = option.value"
              >
                <span class="text-lg" :class="option.icon" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div v-if="isInitialLoading" class="p-4 space-y-3 lg:p-8 sm:p-6" aria-label="Memuat foto">
        <div v-for="index in 6" :key="index" class="rounded-xl bg-neutral-100 h-20 animate-pulse dark:bg-neutral-800" />
      </div>

      <div v-else-if="error && images.length === 0" class="px-6 py-10 text-center flex flex-col items-center" role="alert">
        <span class="rounded-full bg-red-100 flex h-12 w-12 items-center justify-center dark:bg-red-950/50" aria-hidden="true">
          <span class="i-mingcute:wifi-off-line text-2xl text-red-600 dark:text-red-400" />
        </span>
        <h2 class="text-base text-strong font-semibold mb-1 mt-4">
          Foto gagal dimuat
        </h2>
        <p class="text-sm text-muted mb-5">
          Periksa koneksi lalu coba lagi.
        </p>
        <AtomsButton variant="primary" :loading="status === 'pending'" @click="reloadImages">
          <span v-if="status !== 'pending'" class="i-mingcute:refresh-2-line text-base mr-2" aria-hidden="true" />
          Muat ulang
        </AtomsButton>
      </div>

      <div v-else-if="images.length === 0" class="p-8 text-center md:p-16 sm:p-12">
        <div class="mb-6 inline-block relative sm:mb-8">
          <span class="i-mingcute:pic-line text-6xl text-neutral-300 block md:text-8xl sm:text-7xl dark:text-neutral-600" aria-hidden="true" />
          <span class="rounded-full bg-blue-500 h-4 w-4 absolute animate-pulse md:h-6 md:w-6 sm:h-5 sm:w-5 -right-1 -top-1 sm:-right-2 sm:-top-2" aria-hidden="true" />
        </div>
        <h2 class="text-xl text-neutral-900 font-bold mb-3 sm:text-2xl dark:text-white sm:mb-4">
          Belum ada foto
        </h2>
        <p class="text-sm text-neutral-600 mx-auto max-w-md sm:text-base dark:text-neutral-400">
          Gunakan tombol + untuk mengunggah foto pertama Anda.
        </p>
      </div>

      <div
        v-else-if="viewMode === 'card'"
        class="p-3 gap-3 grid grid-cols-2 lg:p-8 sm:p-6 lg:gap-6 sm:gap-4 lg:grid-cols-4 sm:grid-cols-3 xl:grid-cols-5"
      >
        <article
          v-for="image in images"
          :key="image.id"
          class="rounded-lg bg-white shadow-lg [contain-intrinsic-size:auto_260px] [content-visibility:auto] relative overflow-hidden md:rounded-2xl sm:rounded-xl dark:bg-neutral-700/50"
        >
          <div class="flex gap-1 items-center right-2 top-2 absolute z-2">
            <a
              :href="getDownloadUrl(image.id)"
              download
              class="text-white rounded-md bg-neutral-900/75 flex h-8 w-8 shadow-md transition-colors items-center justify-center hover:bg-neutral-900"
              title="Download foto"
              aria-label="Download foto"
            >
              <span class="i-mingcute:download-2-line text-sm" aria-hidden="true" />
            </a>
            <AtomsButton
              variant="danger"
              size="icon"
              class="shadow-md !p-2 !h-8 !w-8"
              title="Hapus foto"
              :disabled="deletingImageId === image.id"
              @click="deleteCandidate = image"
            >
              <span class="i-mingcute:delete-line text-sm" aria-hidden="true" />
            </AtomsButton>
          </div>

          <div class="bg-neutral-100 aspect-square overflow-hidden dark:bg-neutral-800">
            <NuxtImg
              provider="ensik"
              :src="image.id"
              alt=""
              width="480"
              height="480"
              sizes="xs:50vw md:33vw lg:25vw xl:20vw"
              format="webp"
              quality="72"
              fit="cover"
              loading="lazy"
              decoding="async"
              class="h-full w-full object-cover"
            />
          </div>

          <div class="p-3 bg-white lg:p-5 sm:p-4 dark:bg-neutral-800">
            <div class="text-xs text-muted flex flex-col gap-1">
              <span class="flex items-center">
                <span class="i-mingcute:file-line mr-1" aria-hidden="true" />
                {{ formatFileSize(image.size) }}
              </span>
              <span class="flex min-w-0 items-center">
                <span class="i-mingcute:time-line mr-1 shrink-0" aria-hidden="true" />
                <span class="truncate">{{ formatDate(image.uploadedAt) }}</span>
              </span>
            </div>
          </div>
        </article>
      </div>

      <div v-else class="p-4 lg:p-8 sm:p-6">
        <ul class="space-y-3 sm:space-y-4">
          <li
            v-for="image in images"
            :key="image.id"
            class="p-3 rounded-lg bg-white flex shadow-xs [contain-intrinsic-size:auto_48px] [content-visibility:auto] items-center sm:p-4 sm:rounded-xl dark:bg-neutral-800/50"
          >
            <div class="rounded-md bg-neutral-100 shrink-0 h-12 w-12 overflow-hidden sm:rounded-lg dark:bg-neutral-700 md:h-16 md:w-16 sm:h-14 sm:w-14">
              <NuxtImg
                provider="ensik"
                :src="image.id"
                alt=""
                width="64"
                height="64"
                densities="1x 2x"
                format="webp"
                quality="70"
                fit="cover"
                loading="lazy"
                decoding="async"
                class="h-full w-full object-cover"
              />
            </div>

            <div class="ml-3 flex-1 min-w-0 sm:ml-4">
              <div class="text-xs text-neutral-500 flex flex-col gap-1 dark:text-neutral-400 sm:flex-row sm:gap-4 sm:items-center">
                <span class="flex items-center">
                  <span class="i-mingcute:file-line mr-1" aria-hidden="true" />
                  {{ formatFileSize(image.size) }}
                </span>
                <span class="flex min-w-0 items-center">
                  <span class="i-mingcute:time-line mr-1 shrink-0" aria-hidden="true" />
                  <span class="truncate">{{ formatDate(image.uploadedAt) }}</span>
                </span>
              </div>
            </div>

            <div class="ml-2 flex shrink-0 gap-1 items-center">
              <a
                :href="getDownloadUrl(image.id)"
                download
                class="text-neutral-500 rounded-md flex h-9 w-9 transition-colors items-center justify-center dark:(text-neutral-400 hover:text-white hover:bg-neutral-700) hover:text-neutral-900 hover:bg-neutral-100"
                title="Download foto"
                aria-label="Download foto"
              >
                <span class="i-mingcute:download-2-line text-base sm:text-lg" aria-hidden="true" />
              </a>
              <AtomsButton
                variant="ghost"
                size="icon"
                class="shrink-0 !text-red-500"
                title="Hapus foto"
                :disabled="deletingImageId === image.id"
                @click="deleteCandidate = image"
              >
                <span class="i-mingcute:delete-line text-base sm:text-lg" aria-hidden="true" />
              </AtomsButton>
            </div>
          </li>
        </ul>
      </div>

      <div
        v-if="images.length > 0"
        ref="paginationSentinel"
        class="p-4 border-t border-neutral-200/60 flex flex-col gap-2 min-h-20 items-center justify-center dark:border-neutral-700/50"
        aria-live="polite"
      >
        <template v-if="paginationError">
          <p class="text-sm text-red-600 dark:text-red-400">
            {{ paginationError }}
          </p>
          <AtomsButton variant="secondary" size="sm" @click="retryLoadMore">
            Coba lagi
          </AtomsButton>
        </template>
        <span v-else-if="loadingMore || hasMore" class="i-mingcute:loading-fill text-2xl text-neutral-400 animate-spin" aria-label="Memuat gambar berikutnya" />
        <p v-else class="text-sm text-muted">
          Semua foto Anda sudah ditampilkan.
        </p>
      </div>
    </section>
  </div>

  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-150"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-150"
      leave-to-class="opacity-0"
    >
      <div
        v-if="deleteCandidate"
        class="p-4 bg-black/60 flex items-center inset-0 justify-center fixed z-[110] backdrop-blur-xs"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-title"
        @click.self="deleteCandidate = undefined"
      >
        <div class="p-5 rounded-xl bg-white max-w-md w-full shadow-2xl sm:p-6 dark:bg-neutral-900">
          <div class="mb-4 rounded-full bg-red-100 flex h-11 w-11 items-center justify-center dark:bg-red-950/50">
            <span class="i-mingcute:delete-line text-xl text-red-600 dark:text-red-400" aria-hidden="true" />
          </div>
          <h2 id="delete-title" class="text-lg text-strong font-semibold">
            Konfirmasi hapus
          </h2>
          <p class="text-sm text-neutral-600 mb-6 mt-2 dark:text-neutral-400">
            Foto ini akan dihapus permanen dan tidak dapat dipulihkan.
          </p>
          <div class="flex flex-col-reverse gap-2 sm:flex-row sm:gap-3 sm:justify-end">
            <AtomsButton variant="outline" :disabled="Boolean(deletingImageId)" @click="deleteCandidate = undefined">
              Batal
            </AtomsButton>
            <AtomsButton variant="danger" :loading="deletingImageId === deleteCandidate.id" @click="deleteImage">
              Hapus
            </AtomsButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
