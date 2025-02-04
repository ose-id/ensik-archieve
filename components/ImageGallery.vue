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
      <div class="i-lucide-loader-2 animate-spin text-4xl text-gray-900" />
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
      class="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4"
    >
      <div
        v-for="image in images"
        :key="image.pathname"
        class="break-inside-avoid"
      >
        <div class="relative overflow-hidden rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
          <NuxtImg
            :src="image.url"
            :alt="image.pathname"
            class="w-full h-full object-cover block"
          />
          <div class="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 text-sm truncate">
            {{ getUsername(image.pathname) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
