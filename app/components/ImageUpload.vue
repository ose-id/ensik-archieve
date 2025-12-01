<script setup lang="ts">
const emit = defineEmits(['imageUploaded']);
const { loggedIn } = useUserSession();

const imageUrl = ref<string>('');
const isUploading = ref<boolean>(false);
const isDragging = ref<boolean>(false);
const selectedFile = ref<File | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
const alertMessage = ref<string>('');

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file)
    return;

  processFile(file);
}

function onDragOver(e: DragEvent) {
  e.preventDefault();
  isDragging.value = true;
}

function onDragLeave(e: DragEvent) {
  e.preventDefault();
  isDragging.value = false;
}

function onDrop(e: DragEvent) {
  e.preventDefault();
  isDragging.value = false;
  const file = e.dataTransfer?.files?.[0];
  if (file) {
    processFile(file);
  }
}

function processFile(file: File) {
  if (file.size > 2 * 1024 * 1024) { // 2MB limit
    alertMessage.value = 'File size exceeds 2MB limit! Please choose a smaller file.';
    return;
  }

  if (!file.type.startsWith('image/')) {
    alertMessage.value = 'Please upload an image file.';
    return;
  }

  selectedFile.value = file;
  imageUrl.value = URL.createObjectURL(file);
  alertMessage.value = '';
}

function triggerFileInput() {
  fileInputRef.value?.click();
}

function removeImage() {
  selectedFile.value = null;
  imageUrl.value = '';
  alertMessage.value = '';
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
}

async function uploadImage() {
  if (!loggedIn.value || !selectedFile.value)
    return;

  isUploading.value = true;

  const formData = new FormData();
  formData.append('file', selectedFile.value);

  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok)
      throw new Error('Upload failed');
    const data: { url: string; pathname: string } = await response.json();
    emit('imageUploaded', { url: data.url, pathname: data.pathname });
    removeImage();
    window.location.reload(); // Refresh the page
  }
  catch (error) {
    console.error('Upload failed:', error);
    alertMessage.value = 'Upload failed. Please try again.';
  }
  finally {
    isUploading.value = false;
  }
}
</script>

<template>
  <div v-if="loggedIn" class="w-full">
    <div
      class="relative w-full flex flex-col items-center justify-center border-2 rounded-xl border-dashed p-6 transition-all duration-300 ease-in-out"
      :class="[
        isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-neutral-300 dark:border-neutral-700 hover:border-blue-400 dark:hover:border-blue-500',
        imageUrl ? 'border-none p-0' : '',
      ]"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
      <!-- Upload State -->
      <div v-if="!imageUrl" class="h-full w-full flex flex-col cursor-pointer items-center justify-center py-8 text-center" @click="triggerFileInput">
        <div class="mb-4 rounded-full bg-neutral-100 p-4 text-blue-500 dark:bg-neutral-800">
          <div i-mingcute:upload-2-line text-4xl />
        </div>
        <p class="mb-2 text-lg text-neutral-700 font-semibold dark:text-neutral-200">
          Click or drag image to upload
        </p>
        <p class="text-sm text-neutral-500 dark:text-neutral-400">
          SVG, PNG, JPG or GIF (max. 2MB)
        </p>
      </div>

      <!-- Preview State -->
      <div v-else class="group relative w-full overflow-hidden rounded-xl">
        <img :src="imageUrl" alt="Preview" class="h-64 w-full rounded-xl object-cover shadow-sm">

        <div class="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <button
            type="button"
            class="mx-2 rounded-full bg-white p-2 text-red-500 transition-colors hover:bg-red-50"
            title="Remove image"
            @click="removeImage"
          >
            <div i-mingcute:delete-2-line text-xl />
          </button>
        </div>
      </div>

      <input
        ref="fileInputRef"
        type="file"
        accept="image/*"
        class="hidden"
        @change="handleFileSelect"
      >
    </div>

    <!-- Error Message -->
    <div v-if="alertMessage" class="mt-3 flex animate-fade-in items-center text-sm text-red-500">
      <div i-mingcute:alert-line mr-1 />
      {{ alertMessage }}
    </div>

    <!-- Actions -->
    <div v-if="imageUrl" class="mt-4 flex justify-end gap-3">
      <button
        type="button"
        class="rounded-lg bg-neutral-100 px-4 py-2 text-sm text-neutral-600 font-medium transition-colors dark:bg-neutral-800 hover:bg-neutral-200 dark:text-neutral-300 dark:hover:bg-neutral-700"
        :disabled="isUploading"
        @click="removeImage"
      >
        Cancel
      </button>
      <button
        type="button"
        class="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-sm text-white font-medium shadow-sm transition-all disabled:cursor-not-allowed hover:bg-blue-700 disabled:opacity-50 hover:shadow-md"
        :disabled="isUploading"
        @click="uploadImage"
      >
        <div v-if="isUploading" i-mingcute:loading-line animate-spin />
        <div v-else i-mingcute:upload-line />
        {{ isUploading ? 'Uploading...' : 'Upload Image' }}
      </button>
    </div>
  </div>
</template>
