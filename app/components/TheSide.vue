<script setup lang="ts">
interface MenuItem {
  icon: string;
  label: string;
  route: string;
}

const { loggedIn, fetch: fetchSession } = await useUserSession();
const route = useRoute();
const fileInputRef = ref<HTMLInputElement | null>(null);
const isUploading = ref(false);
const showPreviewModal = ref(false);
const selectedFile = ref<File | null>(null);
const previewImageUrl = ref<string>('');

if (import.meta.client) {
  await fetchSession();
}

const menuItems = computed<MenuItem[]>(() => [
  { icon: 'i-mingcute:home-6-line', label: 'Home', route: '/' },
  ...(loggedIn.value
    ? [
        { icon: 'i-mingcute:dashboard-line', label: 'Dashboard', route: '/dashboard' },
      ]
    : []),
]);

const currentPath = computed(() => route.path);

function isActive(path: string) {
  if (path === '/')
    return currentPath.value === '/';

  return currentPath.value === path || currentPath.value.startsWith(`${path}/`);
}

function triggerUpload() {
  fileInputRef.value?.click();
}

function processFile(file: File) {
  if (file.size > 2 * 1024 * 1024) {
    console.warn('File size exceeds 2MB limit!');
    if (fileInputRef.value)
      fileInputRef.value.value = '';
    return;
  }

  if (!file.type.startsWith('image/')) {
    console.warn('Please upload an image file.');
    if (fileInputRef.value)
      fileInputRef.value.value = '';
    return;
  }

  selectedFile.value = file;
  previewImageUrl.value = URL.createObjectURL(file);
  showPreviewModal.value = true;
}

function closePreviewModal() {
  showPreviewModal.value = false;
  selectedFile.value = null;
  previewImageUrl.value = '';
  if (fileInputRef.value)
    fileInputRef.value.value = '';
}

async function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file || !loggedIn.value)
    return;

  processFile(file);
}

async function uploadFile() {
  if (!selectedFile.value)
    return;

  isUploading.value = true;
  const formData = new FormData();
  formData.append('file', selectedFile.value);

  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response || !response.ok)
      throw new Error('Upload failed');

    window.location.reload();
  }
  catch (error) {
    console.error('Upload failed:', error);
  }
  finally {
    isUploading.value = false;
    closePreviewModal();
  }
}
</script>

<template>
  <aside class="fixed left-0 z-50 hidden flex-col border-r-1 border-transparent border-r-solid bg-white shadow-lg md:min-h-screen md:w-20 md:flex dark:border-neutral-800/70 dark:bg-neutral-950">
    <div flexcenter px-4 py-6>
      <NuxtImg src="/img/logo.jpg" alt="Logo" size-6 rounded-full md:size-8 />
    </div>

    <!-- Navigation Menu -->
    <nav flex-grow>
      <ul list-none p-4 space-y-6>
        <li v-for="item in menuItems" :key="item.label">
          <NuxtLink
            :to="item.route"
            class="flexcenter rounded-lg px-2 py-3 transition-colors duration-200"
            :class="[
              isActive(item.route)
                ? ' hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-900 dark:text-white'
                : 'hover:bg-neutral-100 text-neutral-500 dark:text-neutral-400 dark:hover:bg-neutral-800',
            ]"
          >
            <div
              class="text-2xl transition-colors"
              :class="[
                item.icon,
                isActive(item.route) ? 'text-blue-500 dark:text-blue-400' : '',
              ]"
            />
          </NuxtLink>
        </li>

        <!-- Upload Button -->
        <li v-if="loggedIn">
          <button
            class="w-full flexcenter cursor-pointer rounded-lg border-none bg-transparent px-2 py-3 transition-colors duration-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            :disabled="isUploading"
            title="Upload Image"
            @click="triggerUpload"
          >
            <div v-if="isUploading" i-mingcute:loading-line animate-spin text-2xl text-blue-500 />
            <div v-else i-mingcute:plus-line text-2xl text-neutral-500 dark:text-neutral-400 />
          </button>
          <input
            ref="fileInputRef"
            type="file"
            accept="image/*"
            class="hidden"
            @change="handleFileSelect"
          >
        </li>
      </ul>
    </nav>

    <div flexcenter px-4 py-6>
      <ColorMode />
    </div>
  </aside>

  <!-- Preview Modal -->
  <div
    v-if="showPreviewModal"
    class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
    @click="closePreviewModal"
  >
    <div
      class="relative mx-4 h-auto max-h-[100vh] max-w-3xl w-full rounded-xl bg-white shadow-2xl dark:bg-neutral-900"
      @click.stop
    >
      <!-- Modal Header -->
      <div class="flex items-center justify-between border-b border-neutral-200 rounded-t-xl bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
        <h3 class="text-lg text-neutral-800 font-semibold dark:text-neutral-200">
          Image Preview
        </h3>
        <button
          type="button"
          class="cursor-pointer rounded-lg border-none p-2 text-neutral-500 transition-all duration-200 hover:rotate-90 hover:scale-110 hover:bg-red-100 dark:text-neutral-400 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
          @click="closePreviewModal"
        >
          <div i-mingcute:close-line text-xl />
        </button>
      </div>

      <!-- Modal Content -->
      <div class="p-4">
        <div class="mb-4">
          <img
            :src="previewImageUrl"
            alt="Preview"
            class="max-h-[50vh] w-full rounded-lg object-contain"
          >
        </div>

        <!-- File Info -->
        <div v-if="selectedFile" class="mb-4 rounded-lg bg-neutral-50 p-3 dark:bg-neutral-800">
          <div class="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span class="text-neutral-500 dark:text-neutral-400">File Name:</span>
              <p class="truncate text-neutral-800 font-medium dark:text-neutral-200">
                {{ selectedFile.name }}
              </p>
            </div>
            <div>
              <span class="text-neutral-500 dark:text-neutral-400">File Size:</span>
              <p class="text-neutral-800 font-medium dark:text-neutral-200">
                {{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB
              </p>
            </div>
            <div class="col-span-2">
              <span class="text-neutral-500 dark:text-neutral-400">File Type:</span>
              <p class="truncate text-neutral-800 font-medium dark:text-neutral-200">
                {{ selectedFile.type }}
              </p>
            </div>
          </div>
        </div>

        <!-- Modal Actions -->
        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="cursor-pointer rounded-lg border-none bg-neutral-100 px-4 py-2 text-sm text-neutral-600 font-medium transition-colors dark:bg-neutral-800 hover:bg-neutral-200 dark:text-neutral-300 dark:hover:bg-neutral-700"
            @click="closePreviewModal"
          >
            Cancel
          </button>
          <button
            type="button"
            class="flex cursor-pointer items-center gap-2 rounded-lg border-none bg-blue-600 px-6 py-2 text-sm text-white font-medium shadow-sm transition-all disabled:cursor-not-allowed hover:bg-blue-700 disabled:opacity-50 hover:shadow-md"
            :disabled="isUploading"
            @click="uploadFile"
          >
            <div v-if="isUploading" i-mingcute:loading-line animate-spin />
            <div v-else i-mingcute:upload-line />
            {{ isUploading ? 'Uploading...' : 'Upload Image' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
