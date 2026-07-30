<script setup lang="ts">
import type { UploadedArchiveImage } from '~~/shared/types/images';

const MAX_IMAGE_SIZE = 3 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png']);

const { addToast } = useToast();
const { notifyArchiveChanged, uploadRequest } = useArchiveEvents();
const fileInput = ref<HTMLInputElement>();
const selectedFile = shallowRef<File>();
const previewUrl = ref('');
const isUploading = ref(false);
const uploadError = ref('');
const uploadPhase = ref<'complete' | 'idle' | 'processing' | 'uploading'>('idle');
const uploadProgress = ref(0);
const isOpen = ref(false);
let activeRequest: XMLHttpRequest | undefined;

const uploadStatus = computed(() => {
  if (uploadPhase.value === 'processing')
    return 'Memproses dan menyimpan gambar...';
  if (uploadPhase.value === 'complete')
    return 'Upload selesai';
  return `Mengunggah ${uploadProgress.value}%`;
});

watch(uploadRequest, () => {
  if (!isUploading.value)
    isOpen.value = true;
});

onBeforeUnmount(() => {
  activeRequest?.abort();
  revokePreview();
});

function revokePreview() {
  if (previewUrl.value)
    URL.revokeObjectURL(previewUrl.value);
  previewUrl.value = '';
}

function reset() {
  revokePreview();
  selectedFile.value = undefined;
  isOpen.value = false;
  uploadError.value = '';
  uploadPhase.value = 'idle';
  uploadProgress.value = 0;
  clearFileInput();
}

function clearFileInput() {
  if (fileInput.value)
    fileInput.value.value = '';
}

function openFilePicker() {
  const input = fileInput.value;
  if (!input)
    return;

  input.value = '';
  input.click();
}

function setSelectedFile(file: File) {
  if (!ALLOWED_TYPES.has(file.type)) {
    const message = 'Hanya file PNG dan JPEG yang didukung.';
    uploadError.value = message;
    addToast(message, 'warning');
    clearFileInput();
    return;
  }

  if (file.size > MAX_IMAGE_SIZE) {
    const message = 'Ukuran gambar maksimal 3 MB.';
    uploadError.value = message;
    addToast(message, 'error');
    clearFileInput();
    return;
  }

  revokePreview();
  uploadError.value = '';
  uploadPhase.value = 'idle';
  uploadProgress.value = 0;
  selectedFile.value = file;
  previewUrl.value = URL.createObjectURL(file);
}

function chooseFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file)
    return;

  setSelectedFile(file);
}

function dropFile(event: DragEvent) {
  const file = event.dataTransfer?.files[0];
  if (file)
    setSelectedFile(file);
}

function uploadWithProgress(body: FormData) {
  return new Promise<UploadedArchiveImage>((resolve, reject) => {
    const request = new XMLHttpRequest();
    activeRequest = request;
    request.open('POST', '/api/upload');
    request.responseType = 'json';
    request.timeout = 120_000;
    request.withCredentials = true;

    request.upload.addEventListener('progress', (event) => {
      uploadPhase.value = 'uploading';
      if (event.lengthComputable) {
        uploadProgress.value = Math.max(
          uploadProgress.value,
          Math.min(90, Math.round((event.loaded / event.total) * 90)),
        );
      }
    });

    request.upload.addEventListener('load', () => {
      uploadPhase.value = 'processing';
      uploadProgress.value = Math.max(uploadProgress.value, 90);
    });

    request.addEventListener('load', () => {
      activeRequest = undefined;
      const response = request.response as Partial<UploadedArchiveImage> & {
        message?: string;
        statusMessage?: string;
      } | null;

      if (request.status >= 200 && request.status < 300 && response?.item) {
        uploadPhase.value = 'complete';
        uploadProgress.value = 100;
        resolve(response as UploadedArchiveImage);
        return;
      }

      reject(new Error(
        response?.statusMessage
        || response?.message
        || `Upload gagal dengan status ${request.status}.`,
      ));
    });

    request.addEventListener('error', () => {
      activeRequest = undefined;
      reject(new Error('Koneksi terputus saat mengunggah gambar.'));
    });

    request.addEventListener('timeout', () => {
      activeRequest = undefined;
      reject(new Error('Upload melewati batas waktu. Silakan coba lagi.'));
    });

    request.addEventListener('abort', () => {
      activeRequest = undefined;
      reject(new Error('Upload dibatalkan.'));
    });

    request.send(body);
  });
}

async function upload() {
  if (!selectedFile.value || isUploading.value)
    return;

  isUploading.value = true;
  uploadError.value = '';
  uploadPhase.value = 'uploading';
  uploadProgress.value = 0;
  const body = new FormData();
  body.append('file', selectedFile.value);

  try {
    await uploadWithProgress(body);
    notifyArchiveChanged();
    addToast('Gambar berhasil ditambahkan ke arsip.', 'success');
    await new Promise<void>(resolve => window.setTimeout(resolve, 300));
    reset();
  }
  catch (error) {
    const message = error instanceof Error ? error.message : 'Upload gagal.';
    uploadError.value = message;
    uploadPhase.value = 'idle';
    uploadProgress.value = 0;
    addToast(message, 'error');
  }
  finally {
    isUploading.value = false;
  }
}
</script>

<template>
  <input
    ref="fileInput"
    type="file"
    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
    class="hidden"
    @change="chooseFile"
  >

  <MoleculesModal
    :open="isOpen"
    title="Upload foto"
    description="Periksa pratinjau dan detail file sebelum mengunggah."
    size="lg"
    :close-disabled="isUploading"
    @close="reset"
  >
    <div
      v-if="!selectedFile"
      class="min-h-80 flex flex-col items-center justify-center border-2 border-neutral-300 rounded-2xl border-dashed bg-neutral-50 p-8 text-center transition-colors dark:border-neutral-700 dark:bg-neutral-950/60"
      @dragover.prevent
      @drop.prevent="dropFile"
    >
      <div class="h-16 w-16 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950/60">
        <span class="i-mingcute:upload-3-line text-3xl text-blue-600 dark:text-blue-400" aria-hidden="true" />
      </div>
      <h3 class="mb-2 mt-5 text-lg text-neutral-900 font-semibold dark:text-white">
        Pilih foto untuk di-upload
      </h3>
      <p class="mb-5 mt-0 max-w-md text-sm text-neutral-500 dark:text-neutral-400">
        Tarik foto ke area ini atau pilih dari perangkat Anda. Format PNG/JPEG, maksimal 3 MB.
      </p>
      <AtomsButton variant="primary" @click="openFilePicker">
        <span class="i-mingcute:folder-open-line mr-2" aria-hidden="true" />
        Pilih foto
      </AtomsButton>
      <p
        v-if="uploadError"
        class="mb-0 mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300"
        role="alert"
      >
        {{ uploadError }}
      </p>
    </div>

    <div v-else class="grid gap-4 md:grid-cols-[minmax(0,1fr)_17rem]">
      <div class="min-h-56 flex items-center justify-center overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-950">
        <img
          :src="previewUrl"
          alt=""
          class="h-auto max-h-[55vh] w-full object-contain"
        >
      </div>

      <div class="flex flex-col gap-4">
        <dl class="m-0 rounded-xl bg-neutral-50 p-4 text-sm dark:bg-neutral-800/70">
          <div class="min-w-0">
            <dt class="text-xs text-neutral-500 uppercase dark:text-neutral-400">
              Nama file
            </dt>
            <dd class="mb-0 ml-0 mt-1 break-words text-neutral-900 font-medium dark:text-white">
              {{ selectedFile.name }}
            </dd>
          </div>
          <div class="mt-4">
            <dt class="text-xs text-neutral-500 uppercase dark:text-neutral-400">
              Ukuran
            </dt>
            <dd class="mb-0 ml-0 mt-1 text-neutral-900 font-medium dark:text-white">
              {{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB
            </dd>
          </div>
          <div class="mt-4">
            <dt class="text-xs text-neutral-500 uppercase dark:text-neutral-400">
              Format
            </dt>
            <dd class="mb-0 ml-0 mt-1 text-neutral-900 font-medium dark:text-white">
              {{ selectedFile.type === 'image/png' ? 'PNG' : 'JPEG' }}
            </dd>
          </div>
        </dl>

        <div class="flex flex-wrap gap-2">
          <AtomsButton v-if="!isUploading" variant="outline" size="sm" @click="openFilePicker">
            <span class="i-mingcute:refresh-2-line mr-2" aria-hidden="true" />
            Ganti foto
          </AtomsButton>
          <AtomsButton variant="primary" size="sm" :loading="isUploading" @click="upload">
            {{ isUploading ? 'Mengunggah' : 'Upload foto' }}
          </AtomsButton>
        </div>

        <div
          v-if="isUploading"
          class="rounded-xl bg-blue-50 p-4 dark:bg-blue-950/30"
          role="progressbar"
          aria-label="Progress upload"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-valuenow="uploadProgress"
        >
          <div class="mb-2 flex items-center justify-between gap-3 text-sm">
            <span class="text-blue-900 font-medium dark:text-blue-200">{{ uploadStatus }}</span>
            <span class="text-blue-700 tabular-nums dark:text-blue-300">{{ uploadProgress }}%</span>
          </div>
          <div class="h-2 overflow-hidden rounded-full bg-blue-200 dark:bg-blue-900">
            <div
              class="h-full rounded-full bg-blue-600 transition-[width] duration-200"
              :class="uploadPhase === 'processing' ? 'animate-pulse' : ''"
              :style="{ width: `${uploadProgress}%` }"
            />
          </div>
        </div>

        <p
          v-if="uploadError"
          class="m-0 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300"
          role="alert"
        >
          {{ uploadError }}
        </p>

        <p v-if="!isUploading && !uploadError" class="m-0 text-xs text-neutral-500 dark:text-neutral-400">
          Gambar akan diverifikasi kembali di server. Batas ukuran maksimal 3 MB.
        </p>
      </div>
    </div>
  </MoleculesModal>
</template>
