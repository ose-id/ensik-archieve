<script setup vapor lang="ts">
import type { UploadedArchiveImage } from '~~/shared/types/images';

const MAX_IMAGE_SIZE = 3 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png']);

const { addToast } = useToast();
const { notifyArchiveChanged, uploadRequest } = useArchiveEvents();
const uploadInputId = ARCHIVE_UPLOAD_INPUT_ID;
const fileInput = ref<HTMLInputElement>();
const selectedFile = shallowRef<File>();
const previewUrl = ref('');
const isUploading = ref(false);
const uploadError = ref('');
const uploadPhase = ref<'complete' | 'idle' | 'processing' | 'uploading'>('idle');
const uploadProgress = ref(0);
const isOpen = ref(false);
/** Picked straight from the mobile upload button: uploads at once and shows a compact progress card instead of the modal. */
const isDirect = ref(false);
let activeRequest: XMLHttpRequest | undefined;
let cancelRequested = false;

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
  isDirect.value = false;
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
    return false;
  }

  if (file.size > MAX_IMAGE_SIZE) {
    const message = 'Ukuran gambar maksimal 3 MB.';
    uploadError.value = message;
    addToast(message, 'error');
    clearFileInput();
    return false;
  }

  revokePreview();
  uploadError.value = '';
  uploadPhase.value = 'idle';
  uploadProgress.value = 0;
  selectedFile.value = file;
  previewUrl.value = URL.createObjectURL(file);
  return true;
}

function chooseFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file)
    return;

  // With the modal open this is "Pilih/Ganti foto"; otherwise the picker was
  // opened by the mobile upload button and the photo is uploaded right away.
  if (isOpen.value) {
    setSelectedFile(file);
    return;
  }

  if (isUploading.value) {
    addToast('Tunggu upload sebelumnya selesai.', 'info');
    clearFileInput();
    return;
  }

  isDirect.value = true;
  if (setSelectedFile(file))
    void upload();
  else
    isDirect.value = false;
}

function cancelUpload() {
  cancelRequested = true;
  activeRequest?.abort();
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
  cancelRequested = false;
  uploadError.value = '';
  uploadPhase.value = 'uploading';
  uploadProgress.value = 0;
  const body = new FormData();
  body.append('file', selectedFile.value);

  try {
    const { item } = await uploadWithProgress(body);
    notifyArchiveChanged({ type: 'added', image: item });
    addToast('Gambar berhasil ditambahkan ke arsip.', 'success');
    await new Promise<void>(resolve => window.setTimeout(resolve, 300));
    reset();
  }
  catch (error) {
    if (cancelRequested) {
      reset();
      return;
    }

    const message = error instanceof Error
      ? error.message
      : 'Upload gagal.';
    uploadError.value = message;
    uploadPhase.value = 'idle';
    uploadProgress.value = 0;
    // The direct-upload card already shows the error with a retry button.
    if (!isDirect.value)
      addToast(message, 'error');
  }
  finally {
    isUploading.value = false;
  }
}
</script>

<template>
  <input
    :id="uploadInputId"
    ref="fileInput"
    type="file"
    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
    class="hidden"
    @change="chooseFile"
  >

  <Transition
    enter-active-class="transition-[opacity,transform] duration-200 ease-out"
    enter-from-class="translate-y-2 opacity-0"
    leave-active-class="transition-[opacity,transform] duration-200 ease-in"
    leave-to-class="translate-y-2 opacity-0"
  >
    <div
      v-if="isDirect && selectedFile"
      class="p-3 border border-neutral-200 rounded-2xl bg-white flex gap-3 shadow-xl items-center inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] fixed z-[55] dark:border-neutral-800 dark:bg-neutral-900 md:w-80 md:inset-x-auto md:bottom-6 md:right-6"
      role="status"
      aria-live="polite"
    >
      <img
        :src="previewUrl"
        alt=""
        class="rounded-lg shrink-0 h-12 w-12 object-cover"
      >
      <div class="flex-1 min-w-0">
        <p class="text-sm text-strong font-medium truncate">
          {{ uploadError ? 'Upload gagal' : uploadStatus }}
        </p>
        <p v-if="uploadError" class="text-xs text-red-600 mt-0.5 truncate dark:text-red-400">
          {{ uploadError }}
        </p>
        <div
          v-else
          class="mt-2 rounded-full bg-neutral-200 h-1.5 overflow-hidden dark:bg-neutral-800"
          role="progressbar"
          aria-label="Progress upload"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-valuenow="uploadProgress"
        >
          <div
            class="rounded-full bg-blue-600 h-full transition-[width] duration-200"
            :class="uploadPhase === 'processing' ? 'animate-pulse' : ''"
            :style="{ width: `${uploadProgress}%` }"
          />
        </div>
      </div>
      <template v-if="uploadError">
        <button
          type="button"
          class="text-white rounded-full bg-blue-600 flex shrink-0 h-9 w-9 cursor-pointer items-center justify-center active:scale-95"
          aria-label="Coba upload lagi"
          @click="upload"
        >
          <span class="i-mingcute:refresh-2-line text-lg" aria-hidden="true" />
        </button>
        <button
          type="button"
          class="icon-btn"
          aria-label="Tutup"
          @click="reset"
        >
          <span class="i-mingcute:close-line text-xl" aria-hidden="true" />
        </button>
      </template>
      <button
        v-else-if="uploadPhase === 'uploading'"
        type="button"
        class="icon-btn"
        aria-label="Batalkan upload"
        @click="cancelUpload"
      >
        <span class="i-mingcute:close-line text-xl" aria-hidden="true" />
      </button>
    </div>
  </Transition>

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
      class="p-8 text-center border-2 border-neutral-300 rounded-2xl border-dashed bg-neutral-50 flex flex-col min-h-80 transition-colors items-center justify-center dark:border-neutral-700 dark:bg-neutral-950/60"
      @dragover.prevent
      @drop.prevent="dropFile"
    >
      <div class="rounded-full bg-blue-100 flex h-16 w-16 items-center justify-center dark:bg-blue-950/60">
        <span class="i-mingcute:upload-3-line text-3xl text-blue-600 dark:text-blue-400" aria-hidden="true" />
      </div>
      <h3 class="text-lg text-strong font-semibold mb-2 mt-5">
        Pilih foto untuk di-upload
      </h3>
      <p class="text-sm text-muted mb-5 max-w-md">
        Tarik foto ke area ini atau pilih dari perangkat Anda. Format PNG/JPEG, maksimal 3 MB.
      </p>
      <AtomsButton variant="primary" @click="openFilePicker">
        <span class="i-mingcute:folder-open-line mr-2" aria-hidden="true" />
        Pilih foto
      </AtomsButton>
      <p
        v-if="uploadError"
        class="text-sm text-red-700 mt-4 px-3 py-2 rounded-lg bg-red-50 dark:text-red-300 dark:bg-red-950/40"
        role="alert"
      >
        {{ uploadError }}
      </p>
    </div>

    <div v-else class="gap-4 grid md:grid-cols-[minmax(0,1fr)_17rem]">
      <div class="rounded-xl bg-neutral-100 flex min-h-56 items-center justify-center overflow-hidden dark:bg-neutral-950">
        <img
          :src="previewUrl"
          alt=""
          class="h-auto max-h-[55vh] w-full object-contain"
        >
      </div>

      <div class="flex flex-col gap-4">
        <dl class="text-sm p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/70">
          <div class="min-w-0">
            <dt class="text-xs text-neutral-500 uppercase dark:text-neutral-400">
              Nama file
            </dt>
            <dd class="text-strong font-medium mt-1 break-words">
              {{ selectedFile.name }}
            </dd>
          </div>
          <div class="mt-4">
            <dt class="text-xs text-neutral-500 uppercase dark:text-neutral-400">
              Ukuran
            </dt>
            <dd class="text-strong font-medium mt-1">
              {{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB
            </dd>
          </div>
          <div class="mt-4">
            <dt class="text-xs text-neutral-500 uppercase dark:text-neutral-400">
              Format
            </dt>
            <dd class="text-strong font-medium mt-1">
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
          class="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30"
          role="progressbar"
          aria-label="Progress upload"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-valuenow="uploadProgress"
        >
          <div class="text-sm mb-2 flex gap-3 items-center justify-between">
            <span class="text-blue-900 font-medium dark:text-blue-200">{{ uploadStatus }}</span>
            <span class="text-blue-700 tabular-nums dark:text-blue-300">{{ uploadProgress }}%</span>
          </div>
          <div class="rounded-full bg-blue-200 h-2 overflow-hidden dark:bg-blue-900">
            <div
              class="rounded-full bg-blue-600 h-full transition-[width] duration-200"
              :class="uploadPhase === 'processing' ? 'animate-pulse' : ''"
              :style="{ width: `${uploadProgress}%` }"
            />
          </div>
        </div>

        <p
          v-if="uploadError"
          class="text-sm text-red-700 p-3 rounded-xl bg-red-50 dark:text-red-300 dark:bg-red-950/40"
          role="alert"
        >
          {{ uploadError }}
        </p>

        <p v-if="!isUploading && !uploadError" class="text-xs text-muted">
          Gambar akan diverifikasi kembali di server. Batas ukuran maksimal 3 MB.
        </p>
      </div>
    </div>
  </MoleculesModal>
</template>
