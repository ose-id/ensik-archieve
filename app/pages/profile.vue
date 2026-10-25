<script setup vapor lang="ts">
import type { ArchiveImage, ArchiveImagePage, ArchiveSortOrder } from '~~/shared/types/images';
import type { MasonryItem } from '~/composables/useArchiveMasonry';

definePageMeta({
  middleware: 'auth',
});

const PAGE_SIZE = 30;
const PRELOAD_MARGIN = 800;
const FILE_SIZE_UNITS = ['B', 'KB', 'MB', 'GB'];
const SORT_OPTIONS: { label: string; value: ArchiveSortOrder }[] = [
  { label: 'Terbaru', value: 'desc' },
  { label: 'Terlama', value: 'asc' },
];

const { addToast } = useToast();
const { notifyArchiveChanged, onArchiveChanged } = useArchiveEvents();
const { accountSheetOpen, avatarUrl, username } = useArchiveAccount();
const uploadInputId = ARCHIVE_UPLOAD_INPUT_ID;
const sortOrder = useCookie<ArchiveSortOrder>('ensik-profile-sort', {
  default: () => 'desc',
  sameSite: 'lax',
});
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

useSeoMeta({
  title: () => `${username.value} - Ensik Archive`,
});

const isMounted = shallowRef(false);
const selectedKey = ref<string>();
const deleteCandidate = ref<ArchiveImage>();
const deletingImageId = ref('');
const loadingMore = ref(false);
const paginationError = ref('');
const paginationSentinel = ref<HTMLElement>();
const sentinelVisible = useElementVisibility(paginationSentinel, {
  rootMargin: `${PRELOAD_MARGIN}px 0px`,
});
const cursor = ref<string | null>(null);
const hasMore = ref(false);
const total = ref(0);
const totalSize = ref(0);

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
  || (!items.value.length && (status.value === 'idle' || status.value === 'pending')));
const initial = computed(() => username.value.charAt(0).toUpperCase());

watch(data, applyFirstPage, { immediate: true });

watch(sentinelVisible, (visible) => {
  if (visible && sentinelNearViewport())
    void loadMore();
});

onMounted(() => {
  isMounted.value = true;
});

onArchiveChanged((change) => {
  if (change.type === 'added') {
    total.value += 1;
    totalSize.value += change.image.size;
    if (sortOrder.value === 'desc') {
      prepend(toItem(change.image));
    }
    else if (!hasMore.value) {
      append([
        toItem(change.image),
      ]);
    }
    return;
  }

  const removed = items.value.find(item => item.image.id === change.id);
  if (!removed)
    return;

  removeImage(change.id);
  total.value = Math.max(0, total.value - 1);
  totalSize.value = Math.max(0, totalSize.value - removed.image.size);
});

function toItem(image: ArchiveImage): MasonryItem {
  return { image, key: image.id };
}

function applyFirstPage(page: ArchiveImagePage | null | undefined) {
  reset((page?.items || []).map(toItem));
  cursor.value = page?.cursor || null;
  hasMore.value = page?.hasMore || false;
  total.value = page?.total || 0;
  totalSize.value = page?.totalSize || 0;
  paginationError.value = '';
  selectedKey.value = undefined;
}

function sentinelNearViewport() {
  const sentinel = paginationSentinel.value;
  if (!sentinel?.isConnected)
    return false;
  return sentinel.getBoundingClientRect().top < window.innerHeight + PRELOAD_MARGIN;
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

    append(page.items.map(toItem));
    cursor.value = page.cursor;
    hasMore.value = page.hasMore;
  }
  catch {
    paginationError.value = 'Gagal memuat foto berikutnya.';
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
    addToast('Foto dihapus.', 'success');
  }
  catch {
    addToast('Foto gagal dihapus. Muat ulang lalu coba lagi.', 'error');
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

function getDownloadUrl(id: string) {
  return `/api/media/${encodeURIComponent(id)}?download=1`;
}

/** Keyboard activation for the upload label (clicks go through the label itself). */
function openUploadPicker() {
  document.getElementById(uploadInputId)?.click();
}

function reloadImages() {
  void refresh();
}
</script>

<template>
  <div class="mx-auto pb-8 max-w-[1600px]">
    <header class="px-4 pb-6 pt-4 text-center flex flex-col items-center relative sm:pt-8">
      <button
        type="button"
        class="icon-btn right-0 top-2 absolute md:hidden"
        aria-label="Pengaturan"
        aria-haspopup="dialog"
        @click="accountSheetOpen = true"
      >
        <span class="i-mingcute:settings-3-line size-6" aria-hidden="true" />
      </button>

      <NuxtImg
        v-if="avatarUrl"
        :src="avatarUrl"
        alt=""
        width="120"
        height="120"
        densities="1x 2x"
        format="webp"
        class="rounded-full size-24 object-cover sm:size-30"
      />
      <span
        v-else
        class="text-4xl text-strong font-semibold rounded-full bg-neutral-200 flex size-24 items-center justify-center dark:bg-neutral-800 sm:size-30"
        aria-hidden="true"
      >
        {{ initial }}
      </span>

      <h1 class="text-3xl text-strong tracking-tight font-semibold mt-4 sm:text-4xl">
        {{ username }}
      </h1>
      <p class="text-sm text-muted mt-2">
        <template v-if="isInitialLoading">
          Memuat…
        </template>
        <template v-else>
          <span class="text-strong font-semibold">{{ total }}</span> foto · {{ formatFileSize(totalSize) }}
        </template>
      </p>

      <div class="mt-5 flex gap-2">
        <!-- A label for the shared file input opens the photo picker directly. -->
        <label
          :for="uploadInputId"
          role="button"
          tabindex="0"
          class="pill-btn pill-btn-neutral"
          @keydown.enter.prevent="openUploadPicker"
          @keydown.space.prevent="openUploadPicker"
        >
          <span class="i-mingcute:add-line size-5" aria-hidden="true" />
          Upload
        </label>
      </div>
    </header>

    <nav class="mb-6 flex gap-6 justify-center" aria-label="Urutkan foto">
      <button
        v-for="option in SORT_OPTIONS"
        :key="option.value"
        type="button"
        class="text-base font-semibold pb-2 cursor-pointer transition-colors relative"
        :class="sortOrder === option.value ? 'text-strong' : 'text-muted hover:text-strong'"
        :aria-pressed="sortOrder === option.value"
        @click="sortOrder = option.value"
      >
        {{ option.label }}
        <span
          v-if="sortOrder === option.value"
          class="rounded-full bg-neutral-900 h-[3px] inset-x-0 bottom-0 absolute dark:bg-white"
          aria-hidden="true"
        />
      </button>
    </nav>

    <MoleculesMasonrySkeleton v-if="isInitialLoading" aria-label="Memuat foto" />

    <div v-else-if="error && items.length === 0" class="py-16 text-center flex flex-col items-center" role="alert">
      <span class="i-mingcute:wifi-off-line text-muted size-10" aria-hidden="true" />
      <h2 class="text-lg text-strong font-semibold mt-4">
        Foto gagal dimuat
      </h2>
      <p class="text-sm text-muted mt-1">
        Periksa koneksi lalu coba lagi.
      </p>
      <button type="button" class="pill-btn pill-btn-neutral mt-5" :disabled="status === 'pending'" @click="reloadImages">
        <span class="i-mingcute:refresh-2-line size-5" :class="status === 'pending' ? 'animate-spin' : ''" aria-hidden="true" />
        Muat ulang
      </button>
    </div>

    <div v-else-if="items.length === 0" class="py-16 text-center flex flex-col items-center">
      <span class="i-mingcute:photo-album-2-line text-muted size-12" aria-hidden="true" />
      <h2 class="text-xl text-strong font-semibold mt-4">
        Belum ada foto
      </h2>
      <p class="text-sm text-muted mt-1 max-w-xs">
        Foto yang kamu upload akan tampil di sini.
      </p>
      <label :for="uploadInputId" role="button" tabindex="0" class="pill-btn text-white mt-5 bg-red-600 hover:bg-red-700" @keydown.enter.prevent="openUploadPicker">
        Upload foto pertama
      </label>
    </div>

    <div v-else class="flex gap-3 items-start">
      <div
        v-for="(column, columnIndex) in columns"
        :key="columnIndex"
        class="flex flex-1 flex-col gap-3 min-w-0"
      >
        <div
          v-for="(item, row) in column"
          :key="item.key"
          class="group [content-visibility:auto] relative"
          :style="{ aspectRatio: `1 / ${ratioOf(item.image)}` }"
        >
          <button
            type="button"
            class="rounded-2xl bg-neutral-100 block cursor-zoom-in inset-0 absolute overflow-hidden focus-visible:(outline-2 outline-neutral-900 outline-offset-2) dark:(bg-neutral-900 focus-visible:outline-white)"
            :aria-label="`Buka ${item.image.name}`"
            @click="selectedKey = item.key"
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

          <!-- Always visible on touch screens; revealed on hover or keyboard focus on desktop. -->
          <div class="flex gap-2 transition-opacity duration-150 bottom-2 right-2 absolute md:(opacity-0 group-focus-within:opacity-100 group-hover:opacity-100)">
            <a
              :href="getDownloadUrl(item.image.id)"
              download
              class="tile-action"
              aria-label="Download foto"
              title="Download"
            >
              <span class="i-mingcute:download-2-line size-5" aria-hidden="true" />
            </a>
            <button
              type="button"
              class="text-red-600 tile-action"
              aria-label="Hapus foto"
              title="Hapus"
              :disabled="deletingImageId === item.image.id"
              @click="deleteCandidate = item.image"
            >
              <span class="i-mingcute:delete-2-line size-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="items.length > 0"
      ref="paginationSentinel"
      class="py-6 flex flex-col gap-2 min-h-20 items-center justify-center"
      aria-live="polite"
    >
      <template v-if="paginationError">
        <p class="text-sm text-red-600 dark:text-red-400">
          {{ paginationError }}
        </p>
        <button type="button" class="pill-btn pill-btn-neutral" @click="retryLoadMore">
          Coba lagi
        </button>
      </template>
      <span v-else-if="loadingMore || hasMore" class="i-mingcute:loading-fill text-neutral-400 size-6 animate-spin" aria-label="Memuat foto berikutnya" />
    </div>
  </div>

  <OrganismImageViewer v-model:selected-key="selectedKey" :items="items" :load-more="loadMore" />

  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-150"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-150"
      leave-to-class="opacity-0"
    >
      <div
        v-if="deleteCandidate"
        class="p-4 bg-black/50 flex items-center inset-0 justify-center fixed z-[110]"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-title"
        aria-describedby="delete-description"
        @click.self="deleteCandidate = undefined"
      >
        <div class="p-6 text-center rounded-3xl bg-white max-w-sm w-full shadow-2xl dark:bg-neutral-900">
          <h2 id="delete-title" class="text-xl text-strong font-semibold">
            Hapus foto ini?
          </h2>
          <p id="delete-description" class="text-sm text-muted mt-2">
            Foto akan dihapus permanen dari arsip dan tidak bisa dipulihkan.
          </p>
          <div class="mt-6 flex gap-2 justify-center">
            <button type="button" class="pill-btn pill-btn-neutral" :disabled="Boolean(deletingImageId)" @click="deleteCandidate = undefined">
              Batal
            </button>
            <button
              type="button"
              class="pill-btn text-white bg-red-600 hover:bg-red-700 disabled:opacity-60"
              :disabled="Boolean(deletingImageId)"
              @click="deleteImage"
            >
              <span v-if="deletingImageId === deleteCandidate.id" class="i-mingcute:loading-fill size-5 animate-spin" aria-hidden="true" />
              Hapus
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
