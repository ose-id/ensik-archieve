<script setup lang="ts">
useSeoMeta({
  title: 'Ensik Archive',
});

const { loggedIn } = useUserSession();
</script>

<template>
  <div class="min-h-screen bg-white dark:bg-black">
    <TheSide />
    <TheNav />

    <main class="ml-[50px] md:ml-[80px] pt-16 px-2 md:px-4">
      <div class="mx-auto py-8">
        <div
          v-if="loggedIn"
          class="mb-8"
        >
          <ImageUpload />
        </div>
        <div
          v-else
          class="text-center text-gray-500 mb-8"
        >
          <p>Login with Discord to upload images.</p>
        </div>
        <ImageGallery />
      </div>
    </main>
  </div>
</template>
