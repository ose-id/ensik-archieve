<script setup lang="ts">
const images = ref([]);

onMounted(async () => {
  images.value = await $fetch('/api/images');
});
</script>

<template>
  <div class="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-8 py-12 space-y-8">
    <h1>Image Gallery</h1>
    <div v-if="images.length === 0">
      No images uploaded yet.
    </div>
    <div v-else>
      <div
        v-for="image in images"
        :key="image.pathname"
      >
        <NuxtImg
          :src="`/api/files/serve/${image.pathname}`"
          :alt="image.pathname"
        />
      </div>
    </div>
  </div>
</template>
