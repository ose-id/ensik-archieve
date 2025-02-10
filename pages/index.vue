<script setup lang="ts">
useSeoMeta({
  title: 'Ensik Archive',
});

const { loggedIn } = useUserSession();
</script>

<template>
  <div min-h-screen bg-white dark:bg-black>
    <TheSide />
    <TheNav />

    <main px-2 pt-16 md:px-4 ml="[50px] md:[80px]">
      <div mx-auto py-8>
        <div
          v-if="loggedIn"
          mb-4
        >
          <ImageUpload />
        </div>
        <div
          v-else
          mb-8 text-center text-gray-500
        >
          <h1 font-melody mb-4 text-lg text-white lg:text-7xl md:text-4xl>
            Ensik Archieve
          </h1>
          <p>Sign In with Discord to upload images.</p>
        </div>
        <ImageGallery />
      </div>
    </main>
  </div>
</template>
