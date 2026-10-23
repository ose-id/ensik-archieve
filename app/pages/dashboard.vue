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

// Sorting happens on the server across every upload, so changing the order
// refetches the first page instead of re-sorting only what is loaded.
const {
  data,
  error,
  refresh,
  status,
} = useFetch<ArchiveImagePage>('/api/user-images', {
  key: 'user-archive-images',
  deep: false,
  lazy: true,
  query: computed(() => ({ limit: PAGE_SIZE, order: sortOrder.value })),
});

watch(data, applyFirstPage, { immediate: true });

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
  <div class="mx-auto max-w-[1600px] py-4 md:py-8">
    <section class="grid grid-cols-1 mb-8 gap-4 md:grid-cols-2 md:mb-12 md:gap-8 sm:gap-6" aria-label="Ringkasan arsip">
      <article class="relative overflow-hidden rounded-xl from-neutral-50 to-neutral-100 bg-gradient-to-br p-4 shadow-lg sm:rounded-2xl dark:from-neutral-900/20 dark:to-neutral-800/30 md:p-8 sm:p-6">
        <div class="relative z-1 flex items-center justify-between">
          <div class="flex-1">
            <p class="m-0 text-xs text-neutral-600 font-semibold tracking-wide uppercase sm:text-sm dark:text-neutral-400">
              Total foto
            </p>
            <p class="mb-0 mt-1 text-2xl text-neutral-900 font-bold sm:mt-2 md:text-4xl sm:text-3xl dark:text-neutral-100">
              {{ total }}
            </p>
          </div>
          <div class="rounded-xl bg-neutral-600 p-2 shadow-lg sm:rounded-2xl dark:bg-neutral-700 md:p-4 sm:p-3">
            <span class="i-mingcute:pic-line block text-xl text-white md:text-3xl sm:text-2xl" aria-hidden="true" />
          </div>
        </div>
        <span class="absolute h-12 w-12 rounded-full bg-neutral-200/50 -bottom-2 -right-2 md:h-20 md:w-20 sm:h-16 sm:w-16 dark:bg-neutral-700/30" aria-hidden="true" />
      </article>

      <article class="relative overflow-hidden rounded-xl from-neutral-50 to-neutral-100 bg-gradient-to-br p-4 shadow-lg sm:rounded-2xl dark:from-neutral-900/20 dark:to-neutral-800/30 md:p-8 sm:p-6">
        <div class="relative z-1 flex items-center justify-between">
          <div class="min-w-0 flex-1">
            <p class="m-0 text-xs text-neutral-600 font-semibold tracking-wide uppercase sm:text-sm dark:text-neutral-400">
              Total ukuran
            </p>
            <p class="mb-0 mt-1 truncate text-2xl text-neutral-900 font-bold sm:mt-2 md:text-4xl sm:text-3xl dark:text-neutral-100">
              {{ formatFileSize(totalSize) }}
            </p>
          </div>
          <div class="rounded-xl bg-neutral-600 p-2 shadow-lg sm:rounded-2xl dark:bg-neutral-700 md:p-4 sm:p-3">
            <span class="i-mingcute:storage-line block text-xl text-white md:text-3xl sm:text-2xl" aria-hidden="true" />
          </div>
        </div>
        <span class="absolute h-12 w-12 rounded-full bg-neutral-200/50 -bottom-2 -right-2 md:h-20 md:w-20 sm:h-16 sm:w-16 dark:bg-neutral-700/30" aria-hidden="true" />
      </article>
    </section>

    <section class="overflow-hidden rounded-xl bg-white shadow-xl sm:rounded-2xl dark:bg-neutral-800/50" aria-labelledby="user-images-title">
      <header class="border-b border-neutral-200/50 p-4 dark:border-neutral-700/50 md:p-8 sm:p-6">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 id="user-images-title" class="m-0 text-lg text-neutral-900 font-bold md:text-2xl sm:text-xl dark:text-white">
              Foto Anda
            </h1>
            <p class="mb-0 mt-1 text-xs text-neutral-500 sm:text-sm dark:text-neutral-400">
              {{ images.length }} dari {{ total }} foto dimuat
            </p>
          </div>

          <div class="flex flex-col gap-2 sm:flex-row-reverse sm:items-center sm:gap-3">
            <div class="flex items-center gap-1 sm:gap-2" role="group" aria-label="Mode tampilan">
              <AtomsButton
                :variant="viewMode === 'list' ? 'secondary' : 'ghost'"
                size="icon"
                class="!p-2"
                title="Tampilan daftar"
                :aria-pressed="viewMode === 'list'"
                @click="viewMode = 'list'"
              >
                <span class="i-mingcute:list-check-line text-base sm:text-lg" aria-hidden="true" />
              </AtomsButton>
              <AtomsButton
                :variant="viewMode === 'card' ? 'secondary' : 'ghost'"
                size="icon"
                class="!p-2"
                title="Tampilan kartu"
                :aria-pressed="viewMode === 'card'"
                @click="viewMode = 'card'"
              >
                <span class="i-mingcute:grid-line text-base sm:text-lg" aria-hidden="true" />
              </AtomsButton>
            </div>

            <div class="flex items-center gap-2 border border-neutral-200 rounded-lg bg-neutral-100 px-2 py-1 text-xs text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900/60 sm:text-sm dark:text-neutral-200">
              <span class="i-mingcute:sort-descending-line text-base sm:text-lg" aria-hidden="true" />
              <div class="flex items-center gap-1" role="group" aria-label="Urutkan foto">
                <AtomsButton
                  :variant="sortOrder === 'desc' ? 'primary' : 'ghost'"
                  size="sm"
                  :aria-pressed="sortOrder === 'desc'"
                  @click="sortOrder = 'desc'"
                >
                  Terbaru
                </AtomsButton>
                <AtomsButton
                  :variant="sortOrder === 'asc' ? 'primary' : 'ghost'"
                  size="sm"
                  :aria-pressed="sortOrder === 'asc'"
                  @click="sortOrder = 'asc'"
                >
                  Terlama
                </AtomsButton>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div v-if="status === 'pending' && images.length === 0" class="p-4 space-y-3 md:p-8 sm:p-6" aria-label="Memuat foto">
        <div v-for="index in 6" :key="index" class="h-20 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-800" />
      </div>

      <div v-else-if="error && images.length === 0" class="flex flex-col items-center px-6 py-10 text-center" role="alert">
        <span class="h-12 w-12 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-950/50" aria-hidden="true">
          <span class="i-mingcute:wifi-off-line text-2xl text-red-600 dark:text-red-400" />
        </span>
        <h2 class="mb-1 mt-4 text-base text-neutral-900 font-semibold dark:text-white">
          Foto gagal dimuat
        </h2>
        <p class="mb-5 mt-0 text-sm text-neutral-500 dark:text-neutral-400">
          Periksa koneksi lalu coba lagi.
        </p>
        <AtomsButton variant="primary" :loading="status === 'pending'" @click="reloadImages">
          <span v-if="status !== 'pending'" class="i-mingcute:refresh-2-line mr-2 text-base" aria-hidden="true" />
          Muat ulang
        </AtomsButton>
      </div>

      <div v-else-if="images.length === 0" class="p-8 text-center md:p-16 sm:p-12">
        <div class="relative mb-6 inline-block sm:mb-8">
          <span class="i-mingcute:pic-line block text-6xl text-neutral-300 md:text-8xl sm:text-7xl dark:text-neutral-600" aria-hidden="true" />
          <span class="absolute h-4 w-4 animate-pulse rounded-full bg-blue-500 -right-1 -top-1 md:h-6 md:w-6 sm:h-5 sm:w-5 sm:-right-2 sm:-top-2" aria-hidden="true" />
        </div>
        <h2 class="mb-3 text-xl text-neutral-900 font-bold sm:mb-4 sm:text-2xl dark:text-white">
          Belum ada foto
        </h2>
        <p class="mx-auto mb-0 max-w-md text-sm text-neutral-600 sm:text-base dark:text-neutral-400">
          Gunakan tombol tambah di sidebar untuk mengunggah foto pertama Anda.
        </p>
      </div>

      <div
        v-else-if="viewMode === 'card'"
        class="grid grid-cols-1 gap-3 p-4 lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 xl:grid-cols-5 md:gap-6 sm:gap-4 md:p-8 sm:p-6"
      >
        <article
          v-for="image in images"
          :key="image.id"
          class="[content-visibility:auto] relative overflow-hidden rounded-lg bg-white shadow-lg md:rounded-2xl sm:rounded-xl dark:bg-neutral-700/50"
        >
          <div class="absolute right-2 top-2 z-2 flex items-center gap-1">
            <a
              :href="getDownloadUrl(image.id)"
              download
              class="h-8 w-8 flex items-center justify-center rounded-md bg-neutral-900/75 text-white shadow-md transition-colors hover:bg-neutral-900"
              title="Download foto"
              aria-label="Download foto"
            >
              <span class="i-mingcute:download-2-line text-sm" aria-hidden="true" />
            </a>
            <AtomsButton
              variant="danger"
              size="icon"
              class="shadow-md !h-8 !w-8 !p-2"
              title="Hapus foto"
              :disabled="deletingImageId === image.id"
              @click="deleteCandidate = image"
            >
              <span class="i-mingcute:delete-line text-sm" aria-hidden="true" />
            </AtomsButton>
          </div>

          <div class="aspect-square overflow-hidden bg-neutral-100 dark:bg-neutral-800">
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

          <div class="bg-white p-3 dark:bg-neutral-800 md:p-5 sm:p-4">
            <div class="flex flex-col gap-1 text-xs text-neutral-500 sm:flex-row sm:items-center sm:justify-between dark:text-neutral-400">
              <span class="flex items-center">
                <span class="i-mingcute:file-line mr-1" aria-hidden="true" />
                {{ formatFileSize(image.size) }}
              </span>
              <span class="min-w-0 flex items-center">
                <span class="i-mingcute:time-line mr-1 shrink-0" aria-hidden="true" />
                <span class="truncate">{{ formatDate(image.uploadedAt) }}</span>
              </span>
            </div>
          </div>
        </article>
      </div>

      <div v-else class="p-4 md:p-8 sm:p-6">
        <ul class="m-0 list-none p-0 space-y-3 sm:space-y-4">
          <li
            v-for="image in images"
            :key="image.id"
            class="[content-visibility:auto] flex items-center rounded-lg bg-white p-3 shadow-sm sm:rounded-xl dark:bg-neutral-800/50 sm:p-4"
          >
            <div class="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-neutral-100 md:h-16 md:w-16 sm:h-14 sm:w-14 sm:rounded-lg dark:bg-neutral-700">
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

            <div class="ml-3 min-w-0 flex-1 sm:ml-4">
              <div class="flex flex-col gap-1 text-xs text-neutral-500 sm:flex-row sm:items-center sm:gap-4 dark:text-neutral-400">
                <span class="flex items-center">
                  <span class="i-mingcute:file-line mr-1" aria-hidden="true" />
                  {{ formatFileSize(image.size) }}
                </span>
                <span class="min-w-0 flex items-center">
                  <span class="i-mingcute:time-line mr-1 shrink-0" aria-hidden="true" />
                  <span class="truncate">{{ formatDate(image.uploadedAt) }}</span>
                </span>
              </div>
            </div>

            <div class="ml-2 flex shrink-0 items-center gap-1">
              <a
                :href="getDownloadUrl(image.id)"
                download
                class="h-9 w-9 flex items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 dark:text-neutral-400 hover:text-neutral-900 dark:hover:bg-neutral-700 dark:hover:text-white"
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
        class="min-h-20 flex flex-col items-center justify-center gap-2 border-t border-neutral-200/50 p-4 dark:border-neutral-700/50"
        aria-live="polite"
      >
        <template v-if="paginationError">
          <p class="m-0 text-sm text-red-600 dark:text-red-400">
            {{ paginationError }}
          </p>
          <AtomsButton variant="secondary" size="sm" @click="retryLoadMore">
            Coba lagi
          </AtomsButton>
        </template>
        <span v-else-if="loadingMore || hasMore" class="i-mingcute:loading-fill animate-spin text-2xl text-neutral-400" aria-label="Memuat gambar berikutnya" />
        <p v-else class="m-0 text-sm text-neutral-500 dark:text-neutral-400">
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
        class="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-title"
        @click.self="deleteCandidate = undefined"
      >
        <div class="max-w-md w-full rounded-xl bg-white p-5 shadow-2xl dark:bg-neutral-900 sm:p-6">
          <div class="mb-4 h-11 w-11 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-950/50">
            <span class="i-mingcute:delete-line text-xl text-red-600 dark:text-red-400" aria-hidden="true" />
          </div>
          <h2 id="delete-title" class="m-0 text-lg text-neutral-900 font-semibold dark:text-white">
            Konfirmasi hapus
          </h2>
          <p class="mb-6 mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            Foto ini akan dihapus permanen dan tidak dapat dipulihkan.
          </p>
          <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
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
