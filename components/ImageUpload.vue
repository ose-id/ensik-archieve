<script setup lang="ts">
const { loggedIn } = useUserSession();
const emit = defineEmits(['imageUploaded']);

const imageUrl = ref<string>('');
const isUploading = ref<boolean>(false);
const showModal = ref<boolean>(false);
const selectedFile = ref<File | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
const alertMessage = ref<string>('');

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (!target.files || target.files.length === 0) return;

  const file = target.files[0];
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
};

const uploadImage = async () => {
  if (!loggedIn.value || !selectedFile.value) return;

  isUploading.value = true;

  const formData = new FormData();
  formData.append('file', selectedFile.value);

  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error('Upload failed');
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
};

const resetFileInput = () => {
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
};

const cancelUpload = () => {
  imageUrl.value = '';
  selectedFile.value = null;
  showModal.value = false;
  resetFileInput();
};

const closeModal = () => {
  showModal.value = false;
  resetFileInput();
};
</script>

<template>
  <div v-if="loggedIn">
    <p>You can upload images.</p>
    <form class="flex flex-col items-start">
      <label class="block">
        <input
          ref="fileInputRef"
          type="file"
          accept="image/*"
          class="block w-full text-sm text-slate-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-gray-50 file:text-gray-700
            hover:file:bg-gray-100
            file:cursor-pointer cursor-pointer"
          @change="handleFileSelect"
        >
      </label>
      <p class="text-sm text-gray-500 mt-2">
        Max file size: 2MB
      </p>
      <p
        v-if="alertMessage"
        class="text-red-500 mt-2 text-xs md:text-sm"
      >
        {{ alertMessage }}
      </p>
    </form>

    <div
      v-if="showModal"
      class="fixed inset-0 flex justify-center items-center bg-black bg-opacity-90 z-50"
    >
      <div class="relative bg-white rounded-lg shadow-lg w-11/12 md:w-1/2 lg:w-1/3">
        <div class="flexbetween px-6 py-4 border-b border-gray-200">
          <h2 class="text-xl font-semibold text-gray-800">
            Preview Image
          </h2>
          <button
            class="text-red text-4xl cursor-pointer i-mingcute:close-circle-line hover:i-mingcute:close-circle-fill hover:bg-red"
            @click="closeModal"
          />
        </div>
        <div class="px-6 py-4 flex justify-center items-center">
          <img
            :src="imageUrl"
            alt="Selected Image"
            class="max-w-full max-h-96 rounded-lg mx-auto"
          >
        </div>
        <div class="px-6 py-4 border-t border-gray-200 flex justify-center space-x-4">
          <button
            class="bg-blue-500 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md border-none cursor-pointer transition duration-300 transform hover:scale-105"
            :disabled="isUploading"
            @click="uploadImage"
          >
            {{ isUploading ? 'Uploading...' : 'Upload' }}
          </button>
          <button
            class="bg-gray-400 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md border-none cursor-pointer transition duration-300 transform hover:scale-105"
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
