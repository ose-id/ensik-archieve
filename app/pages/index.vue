<script setup lang="ts">
useSeoMeta({
  title: 'Ensik Archive',
});

const { loggedIn, fetch } = await useUserSession();

if (import.meta.client) {
  await fetch();
}
</script>

<template>
  <div min-h-screen bg-white dark:bg-black>
    <TheSide />
    <TheNav />

    <main px-2 pt-16 md:px-4 ml="md:[80px]">
      <div mx-auto py-8>
        <div
          v-if="loggedIn"
          mb-4
        >
          <ImageUpload />
        </div>
        <div v-else mb-8 />
        <ImageGallery />
      </div>
    </main>
    <MobileBottomNav />
  </div>
</template>
