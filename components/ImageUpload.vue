<script setup lang="ts">
const { loggedIn, user } = useUserSession();
const emit = defineEmits(['imageUploaded']);

const discordUser = computed(() => user.value as { discordId: string; username: string } | null);

const imageUrl = ref<string>('');
const isUploading = ref<boolean>(false);
const showModal = ref<boolean>(false);

const handleFileUpload = async (event: Event) => {
  if (!loggedIn.value) return;

  const target = event.target as HTMLInputElement;
  if (!target.files || target.files.length === 0) return;

  const file: File = target.files[0];

  isUploading.value = true;

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error('Upload failed');
    const data: { url: string; pathname: string } = await response.json();
    imageUrl.value = data.url;
    emit('imageUploaded', { url: data.url, pathname: data.pathname });
    showModal.value = true; // Show modal on successful upload
  }
  catch (error) {
    console.error('Upload failed:', error);
  }
  finally {
    isUploading.value = false;
  }
};

const uploadImage = async () => {
  showModal.value = false;
  window.location.reload(); // Refresh the page
};

const cancelUpload = () => {
  imageUrl.value = '';
  showModal.value = false;
};

const closeModal = () => {
  showModal.value = false;
};
</script>

<template>
  <div v-if="loggedIn">
    <p>You can upload images.</p>
    <form class="flex items-center">
      <div class="shrink-0">
        <img
          v-if="imageUrl"
          :src="imageUrl"
          :alt="discordUser?.username || 'Uploaded Image'"
          class="h-16 w-16 object-cover rounded-full mr-6"
          @click="showModal = true" 
        >
      </div>
      <label class="block">
        <input
          type="file"
          accept="image/*"
          class="block w-full text-sm text-slate-500
      file:mr-4 file:py-2 file:px-4
      file:rounded-full file:border-0
      file:text-sm file:font-semibold
      file:bg-gray-50 file:text-gray-700
      hover:file:bg-gray-100
      file:cursor-pointer cursor-pointer
    "
          @change="handleFileUpload"
        >
      </label>
    </form>
    <p v-if="isUploading">
      Uploading...
    </p>

    <div v-if="showModal" class="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
      <!-- Modal Container -->
      <div class="relative bg-white rounded-lg shadow-lg w-11/12 md:w-1/2 lg:w-1/3">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 class="text-xl font-semibold text-gray-800">Preview Image</h2>
          <button @click="closeModal"
            class="absolute top-3 right-3 p-2 bg-gray-100 hover:bg-gray-200 transition duration-300 rounded-full text-gray-600 hover:text-gray-800">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="px-6 py-4 flex justify-center items-center">
          <img :src="imageUrl" alt="Gambar yang diunggah" class="max-w-full max-h-96 rounded-lg mx-auto">
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-gray-200 flex justify-center">
          <button @click="uploadImage"
            class="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-300 transform hover:scale-105">
            Upload
          </button>
        </div>
      </div>
    </div>

  </div>
</template>