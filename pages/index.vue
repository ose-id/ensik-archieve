<script setup lang="ts">
useSeoMeta({
  title: 'Ensik Archieve',
});

const { loggedIn } = useUserSession();
</script>

<template>
  <section class="container mx-auto py-12">
    <TheNav />
    <div
      v-if="loggedIn"
      class="mt-8"
    >
      <ImageUpload />
    </div>
    <div
      v-else
      class="text-center text-gray-500 mt-8"
    >
      <p>Login with Discord to upload images.</p>
    </div>
    <ImageGallery />
  </section>
</template>
