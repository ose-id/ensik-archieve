<script setup lang="ts">
const emit = defineEmits(['imageUploaded']);
const { loggedIn } = useUserSession();
const imageUrl = ref<string>('');
const isUploading = ref<boolean>(false);
const showModal = ref<boolean>(false);
const selectedFile = ref<File | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
const alertMessage = ref<string>('');

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  if (!target.files || target.files.length === 0)
    return;

  const file = target.files[0];
  if (!file) {
    return;
  }

  if (file.size > 2 * 1024 * 1024) { // 2MB limit
    alertMessage.value = 'File size exceeds 2MB limit! Please choose a smaller file.';
    selectedFile.value = null;
    imageUrl.value = '';
    resetFileInput();
    return;
  }

  selectedFile.value = file;
  imageUrl.value = URL.createObjectURL(file);
  alertMessage.value = '';
  showModal.value = true;
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
    imageUrl.value = data.url;
    emit('imageUploaded', { url: data.url, pathname: data.pathname });
    showModal.value = false;
    window.location.reload(); // Refresh the page
  }
  catch (error) {
    console.error('Upload failed:', error);
  }
  finally {
    isUploading.value = false;
  }
}

function resetFileInput() {
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
}

function cancelUpload() {
  imageUrl.value = '';
  selectedFile.value = null;
  showModal.value = false;
  resetFileInput();
}

function closeModal() {
  showModal.value = false;
  resetFileInput();
}
</script>

<template>
  <div v-if="loggedIn">
    <p>You can upload images.</p>
    <form flex flex-col items-start>
      <label block>
        <input
          ref="fileInputRef"
          type="file"
          accept="image/*"
          block w-full cursor-pointer text-sm text-slate-500 file:mr-4 file:cursor-pointer file:border-0 file:rounded-full file:bg-neutral-50 file:px-4 file:py-2 file:text-sm file:text-neutral-700 file:font-semibold hover:file:bg-neutral-100
          @change="handleFileSelect"
        >
      </label>
      <p mt-2 text-sm text-neutral-500>
        Max file size: 2MB
      </p>
      <p
        v-if="alertMessage"
        mt-2 text-xs text-red-500 md:text-sm
      >
        {{ alertMessage }}
      </p>
    </form>

    <div
      v-if="showModal"
      fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90
    >
      <div class="relative w-11/12 rounded-lg bg-white shadow-lg lg:w-1/3 md:w-1/2">
        <div flexbetween border-b border-neutral-200 px-6 py-4>
          <h2 text-xl text-neutral-800 font-semibold>
            Preview Image
          </h2>
          <button
            i-mingcute:close-circle-line hover:i-mingcute:close-circle-fill cursor-pointer text-4xl text-red hover:bg-red
            @click="closeModal"
          />
        </div>
        <div flex items-center justify-center px-6 py-4>
          <NuxtImg
            :src="imageUrl"
            alt="Selected Image"
            mx-auto max-h-96 max-w-full rounded-lg
          />
        </div>
        <div flex justify-center border-t border-neutral-200 px-6 py-4 space-x-4>
          <button
            transform cursor-pointer rounded-lg border-none bg-blue-500 px-6 py-3 text-white font-semibold shadow-md transition duration-300 hover:scale-105 hover:bg-blue-700
            :disabled="isUploading"
            @click="uploadImage"
          >
            {{ isUploading ? 'Uploading...' : 'Upload' }}
          </button>
          <button
            transform cursor-pointer rounded-lg border-none bg-neutral-400 px-6 py-3 text-white font-semibold shadow-md transition duration-300 hover:scale-105 hover:bg-neutral-600
            :disabled="isUploading"
            @click="cancelUpload"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
