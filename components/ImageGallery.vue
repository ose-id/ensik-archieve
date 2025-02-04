<script setup lang="ts">
const images = ref<{ url: string; pathname: string }[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);

onMounted(async () => {
  try {
    images.value = await $fetch('/api/images');
  }
  catch (err) {
    console.error('Failed to fetch images:', err);
    error.value = 'Failed to load images.';
  }
  finally {
    isLoading.value = false;
  }
});

const getUsername = (pathname: string) => {
  return pathname.split('-')[0];
};
</script>

<template>
  <div class="container mx-auto px-4 py-12">
    <div
      v-if="isLoading"
      class="flex justify-center items-center h-64"
    >
      <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-gray-900" />
    </div>

    <div
      v-else-if="error"
      class="text-center text-red-500 p-4 bg-red-100 rounded-lg"
    >
      {{ error }}
    </div>

    <div
      v-else-if="images.length === 0"
      class="text-center text-gray-500 p-4 bg-gray-100 rounded-lg"
    >
      No images uploaded yet.
    </div>

    <div
      v-else
      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
    >
      <div
        v-for="image in images"
        :key="image.pathname"
        class="relative overflow-hidden rounded-lg shadow-lg transition-transform duration-300 hover:scale-105"
      >
        <NuxtImg
          :src="image.url"
          :alt="image.pathname"
          class="w-full h-full object-cover"
        />
        <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-sm truncate">
          {{ getUsername(image.pathname) }}
        </div>
      </div>
    </div>
  </div>
</template>
