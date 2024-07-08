<!-- pages/upload.vue -->
<script setup lang="ts">
async function uploadImage(e: Event) {
  const form = e.target as HTMLFormElement;

  await $fetch('/api/images', {
    method: 'POST',
    body: new FormData(form),
  }).catch(err => alert('Failed to upload image:\n' + err.data?.message));

  form.reset();
}
</script>

<template>
  <form @submit.prevent="uploadImage">
    <label>Upload an image: <input
      type="file"
      name="file"
    ></label>
    <button type="submit">
      Upload
    </button>
  </form>
</template>
