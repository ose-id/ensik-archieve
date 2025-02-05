<script setup lang="ts">
const images = ref<{ url: string; pathname: string }[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);
const showPopup = ref(false);
const selectedImage = ref<{ url: string; pathname: string } | null>(null);
const currentIndex = ref(0);

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

const getUsername = (pathname: string) => pathname.split('-')[0];

const openPopup = (image: { url: string; pathname: string }, index: number) => {
  selectedImage.value = image;
  currentIndex.value = index;
  showPopup.value = true;
};

const closePopup = () => {
  showPopup.value = false;
  selectedImage.value = null;
};

const nextImage = () => {
  if (currentIndex.value < images.value.length - 1) {
    currentIndex.value++;
    selectedImage.value = images.value[currentIndex.value];
  }
};

const prevImage = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--;
    selectedImage.value = images.value[currentIndex.value];
  }
};

const downloadImage = async (image: { url: string; pathname: string }) => {
  try {
    const response = await fetch(image.url);
    const blob = await response.blob();

    const extensionRegex = /\.(jpg|jpeg|png|gif|webp)$/i;
    let filename = image.pathname;
    if (!extensionRegex.test(filename)) {
      filename += '.jpg';
    }

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  catch (err) {
    console.error('Failed to download image:', err);
  }
};
</script>

<template>
  <div class="mx-auto py-12">
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
      class="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4"
    >
      <div
        v-for="(image, index) in images"
        :key="image.pathname"
        class="break-inside-avoid"
      >
        <div
          class="relative group overflow-hidden rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer"
          @click="openPopup(image, index)"
        >
          <NuxtImg
            :src="image.url"
            :alt="image.pathname"
            class="size-full object-cover block"
          />
          <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div class="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 text-xs md:text-sm truncate">
            {{ getUsername(image.pathname) }}
          </div>
        </div>
      </div>
    </div>
  </div>

  <div
    v-if="showPopup"
    class="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50"
  >
    <button
      class="absolute left-4 top-1/2 transform -translate-y-1/2 cursor-pointer text-white text-3xl hover:text-blue-300 i-mingcute:arrow-left-circle-line"
      @click="prevImage"
    />
    <div class="relative bg-gray-900/70 p-4 rounded-lg max-w-3xl w-full flex flex-col items-center">
      <button
        class="absolute -top-4 -right-4 text-red text-4xl cursor-pointer i-mingcute:close-circle-line hover:i-mingcute:close-circle-fill hover:bg-red"
        @click="closePopup"
      />
      <img
        :src="selectedImage?.url"
        alt="Popup Image"
        class="max-w-full max-h-[80vh]"
      >
      <button
        class="mt-4 bg-green-500 text-white p-2 rounded-lg cursor-pointer"
        @click="downloadImage(selectedImage!)"
      >
        ⬇ Download
      </button>
    </div>
    <button
      class="absolute right-4 top-1/2 transform -translate-y-1/2 cursor-pointer text-white text-3xl hover:text-blue-300 i-mingcute:arrow-right-circle-line"
      @click="nextImage"
    />
  </div>
</template>
