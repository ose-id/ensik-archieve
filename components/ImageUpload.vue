<script setup lang="ts">
const { loggedIn, user } = useUserSession();
const emit = defineEmits(['imageUploaded']);

const discordUser = computed(() => user.value as { discordId: string; username: string } | null);

const imageUrl = ref<string>('');
const isUploading = ref<boolean>(false);

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
  }
  catch (error) {
    console.error('Upload failed:', error);
  }
  finally {
    isUploading.value = false;
  }
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
    "
          @change="handleFileUpload"
        >
      </label>
    </form>
    <p v-if="isUploading">
      Uploading...
    </p>
  </div>
</template>
