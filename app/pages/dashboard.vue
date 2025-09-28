<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
});

interface ImageBlob {
  url: string;
  pathname: string;
  size: number;
  uploadedAt: string;
}

const { loggedIn } = useUserSession();

if (import.meta.client && !loggedIn.value) {
  await navigateTo('/');
}

const images = ref<ImageBlob[]>([]);
const showDeleteConfirm = ref<string | null>(null);
const isDeleting = ref<string | null>(null);
const viewMode = ref<'list' | 'card'>('list');
const sortOrder = ref<'desc' | 'asc'>('desc');

const sortedImages = computed(() => {
  return [...images.value].sort((a, b) => {
    const dateA = new Date(a.uploadedAt).getTime();
    const dateB = new Date(b.uploadedAt).getTime();

    return sortOrder.value === 'desc'
      ? dateB - dateA
      : dateA - dateB;
  });
});

async function deleteImage(imageUrl: string) {
  if (isDeleting.value)
    return;

  isDeleting.value = imageUrl;

  try {
    await $fetch('/api/delete-image', {
      method: 'DELETE',
      body: { url: imageUrl },
    });
    images.value = images.value.filter(img => img.url !== imageUrl);
    showDeleteConfirm.value = null;
  }
  catch {}
  finally {
    isDeleting.value = null;
  }
}

function formatFileSize(bytes: number) {
  if (bytes === 0)
    return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

onMounted(async () => {
  try {
    const userImages = await $fetch('/api/user-images');
    images.value = userImages || [];
  }
  catch (error) {
    console.error('Failed to fetch images:', error);
  }
});
</script>

<template>
  <div class="min-h-screen bg-white dark:bg-black">
    <div v-if="!loggedIn" class="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-black">
      <div class="flex flex-col items-center gap-4">
        <div class="h-8 w-8 animate-spin border-4 border-neutral-300 border-t-blue-600 rounded-full" />
        <p class="text-sm text-neutral-600 dark:text-neutral-400">
          Redirecting...
        </p>
      </div>
    </div>

    <template v-else>
      <TheSide />
      <TheNav />

      <main class="ml-[50px] px-3 pt-16 md:ml-[80px] lg:px-8 md:px-6">
        <div class="mx-auto py-4 md:py-8">
          <div class="grid grid-cols-1 mb-8 gap-4 md:grid-cols-2 md:mb-12 md:gap-8 sm:gap-6">
            <div class="group relative overflow-hidden rounded-xl from-neutral-50 to-neutral-100 bg-gradient-to-br p-4 shadow-lg transition-all duration-300 sm:rounded-2xl dark:from-neutral-900/20 dark:to-neutral-800/30 md:p-8 sm:p-6 hover:shadow-2xl">
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <p class="text-xs text-neutral-600 font-semibold tracking-wide uppercase sm:text-sm dark:text-neutral-400">
                    Total Foto
                  </p>
                  <p class="mt-1 text-2xl text-neutral-900 font-bold sm:mt-2 md:text-4xl sm:text-3xl dark:text-neutral-100">
                    {{ images.length }}
                  </p>
                </div>
                <div class="rounded-xl bg-neutral-500 p-2 shadow-lg sm:rounded-2xl dark:bg-neutral-600 md:p-4 sm:p-3">
                  <div class="i-mingcute:pic-line text-xl text-white md:text-3xl sm:text-2xl" />
                </div>
              </div>
              <div class="absolute h-12 w-12 rounded-full bg-neutral-200/50 -bottom-2 -right-2 md:h-20 md:w-20 sm:h-16 sm:w-16 dark:bg-neutral-700/30" />
            </div>

            <div class="group relative overflow-hidden rounded-xl from-neutral-50 to-neutral-100 bg-gradient-to-br p-4 shadow-lg transition-all duration-300 sm:rounded-2xl dark:from-neutral-900/20 dark:to-neutral-800/30 md:p-8 sm:p-6 hover:shadow-2xl">
              <div class="flex items-center justify-between">
                <div class="min-w-0 flex-1">
                  <p class="text-xs text-neutral-600 font-semibold tracking-wide uppercase sm:text-sm dark:text-neutral-400">
                    Total Ukuran
                  </p>
                  <p class="mt-1 truncate text-2xl text-neutral-900 font-bold sm:mt-2 md:text-4xl sm:text-3xl dark:text-neutral-100">
                    {{ formatFileSize(images.reduce((acc, img) => acc + img.size, 0)) }}
                  </p>
                </div>
                <div class="rounded-xl bg-neutral-500 p-2 shadow-lg sm:rounded-2xl dark:bg-neutral-600 md:p-4 sm:p-3">
                  <div class="i-mingcute:storage-line text-xl text-white md:text-3xl sm:text-2xl" />
                </div>
              </div>
              <div class="absolute h-12 w-12 rounded-full bg-neutral-200/50 -bottom-2 -right-2 md:h-20 md:w-20 sm:h-16 sm:w-16 dark:bg-neutral-700/30" />
            </div>
          </div>

          <div class="rounded-xl bg-white shadow-xl backdrop-blur-sm sm:rounded-2xl dark:bg-neutral-800/50">
            <div class="border-b border-neutral-200/50 p-4 dark:border-neutral-700/50 md:p-8 sm:p-6">
              <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
                <div>
                  <h2 class="text-lg text-neutral-900 font-bold md:text-2xl sm:text-xl dark:text-white">
                    Foto Anda
                  </h2>
                  <p class="mt-1 text-xs text-neutral-500 sm:text-sm dark:text-neutral-400">
                    {{ images.length }} foto tersimpan
                  </p>
                </div>
                <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                  <div class="flex items-center rounded-md bg-neutral-100 px-2 py-1 text-neutral-600 dark:bg-neutral-700/40 dark:text-neutral-200">
                    <div class="i-mingcute:sort-descending-line mr-2 text-base sm:text-lg" />
                    <select
                      v-model="sortOrder"
                      class="text-xs sm:text-sm"
                      bg="transparent"
                      border="none"
                      cursor="pointer"
                      focus:outline="none"
                    >
                      <option value="desc">
                        Terbaru
                      </option>
                      <option value="asc">
                        Terlama
                      </option>
                    </select>
                  </div>

                  <div class="flex items-center space-x-1 sm:space-x-2">
                    <button
                      class="cursor-pointer rounded-md border-none p-2 transition-colors"
                      :class="viewMode === 'list' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300'"
                      title="Tampilan List"
                      @click="viewMode = 'list'"
                    >
                      <div class="i-mingcute:list-check-line text-base sm:text-lg" />
                    </button>
                    <button
                      class="cursor-pointer rounded-md border-none p-2 transition-colors"
                      :class="viewMode === 'card' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300'"
                      title="Tampilan Card"
                      @click="viewMode = 'card'"
                    >
                      <div class="i-mingcute:grid-line text-base sm:text-lg" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="images.length === 0" class="p-8 text-center md:p-16 sm:p-12">
              <div class="relative mb-6 inline-block sm:mb-8">
                <div class="i-mingcute:pic-line text-6xl text-neutral-300 md:text-8xl sm:text-7xl dark:text-neutral-600" />
                <div class="absolute h-4 w-4 animate-pulse rounded-full bg-blue-500 -right-1 -top-1 md:h-6 md:w-6 sm:h-5 sm:w-5 sm:-right-2 sm:-top-2" />
              </div>
              <h3 class="mb-3 text-xl text-neutral-900 font-bold sm:mb-4 sm:text-2xl dark:text-white">
                Belum ada foto
              </h3>
              <p class="mx-auto mb-6 max-w-sm text-sm text-neutral-600 md:mb-8 sm:max-w-md sm:text-base dark:text-neutral-400">
                Anda belum mengupload foto apapun. Mulai upload foto pertama Anda dan buat koleksi yang menakjubkan!
              </p>
              <NuxtLink to="/" class="inline-flex items-center rounded-xl from-blue-600 to-purple-600 bg-gradient-to-r px-6 py-3 text-sm text-white font-semibold shadow-lg transition-all duration-200 sm:rounded-2xl sm:px-8 sm:py-4 sm:text-base hover:shadow-xl">
                <div class="i-mingcute:upload-line mr-2 text-base sm:mr-3 sm:text-lg" />
                Upload Foto Sekarang
              </NuxtLink>
            </div>

            <div v-else-if="viewMode === 'card'" class="grid grid-cols-2 gap-3 p-4 lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 xl:grid-cols-5 md:gap-6 sm:gap-4 md:p-8 sm:p-6">
              <div v-for="image in sortedImages" :key="image.url" class="group relative overflow-hidden rounded-lg bg-white shadow-lg transition-all duration-300 md:rounded-2xl sm:rounded-xl dark:bg-neutral-700/50 hover:shadow-2xl">
                <button
                  class="absolute right-1 top-1 z-20 hidden cursor-pointer rounded-md border-none bg-red-500 p-1.5 text-white opacity-0 shadow-lg transition-all duration-200 sm:right-2 sm:top-2 sm:block hover:scale-110 hover:bg-red-600 md:p-3 sm:p-2 group-hover:opacity-100"
                  title="Hapus foto"
                  :disabled="isDeleting === image.url"
                  @click="showDeleteConfirm = image.url"
                >
                  <div class="i-mingcute:delete-line text-xs sm:text-sm" />
                </button>

                <div class="aspect-square overflow-hidden rounded-t-lg md:rounded-t-2xl sm:rounded-t-xl">
                  <img
                    :src="image.url"
                    :alt="image.pathname"
                    class="h-full w-full object-cover transition-all duration-500 group-hover:scale-110"
                    loading="lazy"
                  >
                </div>

                <div class="absolute inset-0 from-black/20 to-transparent bg-gradient-to-t opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                <div class="bg-white p-3 dark:bg-neutral-800 md:p-6 sm:p-4">
                  <div class="flex items-start justify-between gap-2">
                    <div class="min-w-0 flex-1">
                      <p class="mb-1 truncate text-xs text-neutral-900 font-semibold sm:mb-2 sm:text-sm dark:text-white">
                        {{ image.pathname.split('-').slice(2).join('-') }}
                      </p>
                      <div class="flex flex-col gap-1 text-xs text-neutral-500 sm:flex-row sm:items-center sm:justify-between sm:gap-0 dark:text-neutral-400">
                        <span class="flex items-center">
                          <div class="i-mingcute:file-line mr-1" />
                          {{ formatFileSize(image.size) }}
                        </span>
                        <span class="flex items-center truncate">
                          <div class="i-mingcute:time-line mr-1" />
                          <span class="truncate">{{ formatDate(image.uploadedAt).split(' ')[0] }}</span>
                        </span>
                      </div>
                    </div>

                    <button
                      class="cursor-pointer rounded-md border-none bg-red-500 p-1 text-white shadow-sm transition-all duration-200 sm:hidden active:scale-95 hover:bg-red-600"
                      title="Hapus foto"
                      :disabled="isDeleting === image.url"
                      @click="showDeleteConfirm = image.url"
                    >
                      <div class="i-mingcute:delete-line text-xs" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="p-4 md:p-8 sm:p-6">
              <div class="space-y-3 sm:space-y-4">
                <div v-for="image in sortedImages" :key="image.url" class="group flex items-center rounded-lg bg-white p-3 shadow-sm transition-all duration-200 sm:rounded-xl dark:bg-neutral-800/50 sm:p-4 hover:shadow-md">
                  <div class="h-12 w-12 flex-shrink-0 overflow-hidden rounded-md md:h-16 md:w-16 sm:h-14 sm:w-14 sm:rounded-lg">
                    <img
                      :src="image.url"
                      :alt="image.pathname"
                      class="h-full w-full object-cover"
                      loading="lazy"
                    >
                  </div>

                  <div class="ml-3 min-w-0 flex-1 sm:ml-4">
                    <h3 class="truncate text-xs text-neutral-900 font-semibold sm:text-sm dark:text-white">
                      {{ image.pathname.split('-').slice(2).join('-') }}
                    </h3>
                    <div class="mt-1 flex flex-col gap-1 text-xs text-neutral-500 sm:flex-row sm:items-center sm:gap-0 dark:text-neutral-400 sm:space-x-4">
                      <span class="flex items-center">
                        <div class="i-mingcute:file-line mr-1" />
                        {{ formatFileSize(image.size) }}
                      </span>
                      <span class="flex items-center">
                        <div class="i-mingcute:time-line mr-1" />
                        <span class="hidden sm:inline">{{ formatDate(image.uploadedAt) }}</span>
                        <span class="sm:hidden">{{ formatDate(image.uploadedAt).split(' ')[0] }}</span>
                      </span>
                    </div>
                  </div>

                  <div class="flex items-center">
                    <button
                      :disabled="isDeleting === image.url"
                      class="cursor-pointer rounded-md border-none p-1.5 text-neutral-400 transition-colors sm:p-2 hover:text-red-600 disabled:opacity-50"
                      title="Hapus foto"
                      @click="showDeleteConfirm = image.url"
                    >
                      <div class="i-mingcute:delete-line text-base sm:text-lg" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </template>

    <div v-if="showDeleteConfirm" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
      <div class="max-w-sm w-full rounded-lg bg-white p-4 shadow-xl sm:max-w-md sm:rounded-xl dark:bg-neutral-800 sm:p-6">
        <h3 class="mb-3 text-base text-neutral-900 font-semibold sm:mb-4 sm:text-lg dark:text-white">
          Konfirmasi Hapus
        </h3>
        <p class="mb-4 text-sm text-neutral-600 sm:mb-6 sm:text-base dark:text-neutral-400">
          Apakah Anda yakin ingin menghapus foto ini? Tindakan ini tidak dapat dibatalkan.
        </p>
        <div class="flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3">
          <button
            class="cursor-pointer border border-neutral-300 rounded-md bg-transparent px-4 py-2 text-sm text-neutral-700 transition-colors dark:border-neutral-600 hover:bg-neutral-50 sm:text-base dark:text-neutral-300 dark:hover:bg-neutral-700"
            :disabled="isDeleting === showDeleteConfirm"
            @click="showDeleteConfirm = null"
          >
            Batal
          </button>
          <button
            class="cursor-pointer rounded-md border-none bg-red-600 px-4 py-2 text-sm text-white transition-colors hover:bg-red-700 sm:text-base disabled:opacity-50"
            :disabled="isDeleting === showDeleteConfirm"
            @click="deleteImage(showDeleteConfirm!)"
          >
            <span v-if="isDeleting === showDeleteConfirm">Menghapus...</span>
            <span v-else>Hapus</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
