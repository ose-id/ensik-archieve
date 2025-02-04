<script setup lang="ts">
const { loggedIn, user } = useUserSession();

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

    const data: { url: string } = await response.json();
    imageUrl.value = data.url;
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
    <h2 class="text-xl font-bold">
      Welcome, {{ discordUser?.username }}
    </h2>
    <p>You can upload images.</p>
    <input
      type="file"
      accept="image/*"
      @change="handleFileUpload"
    >
    <p v-if="isUploading">
      Uploading...
    </p>
    <img
      v-if="imageUrl"
      :src="imageUrl"
      :alt="discordUser?.username || 'Uploaded Image'"
      class="uploaded-image"
    >
  </div>
</template>

<style scoped>
.uploaded-image {
    max-width: 100%;
    height: auto;
    border-radius: 10px;
}
</style>
