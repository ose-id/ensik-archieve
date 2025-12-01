<script setup lang="ts">
useSeoMeta({
  title: 'Ensik Archive',
});

const { fetch } = await useUserSession();

if (import.meta.client) {
  await fetch();
}
</script>

<template>
  <div min-h-screen bg-white dark:bg-black>
    <TheSide />
    <TheNav />

    <main px-2 pt-12 md:px-4 ml="md:[80px]">
      <div mx-auto pb-8>
        <div mb-8 />
        <ImageGallery />
      </div>
    </main>
    <MobileBottomNav />
  </div>
</template>
