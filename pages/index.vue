<template>
  <main class="container mx-auto py-12">
    <Nav />
    <div class="grid grid-cols-2 md:grid-cols-3 gap-8 py-12">
      <Card />
    </div>
  </main>
</template>

<script lang="ts" setup>
useSeoMeta({
  title: "Ensik Archieve",
  description: "What is the Ensik Archive? To save some ensikolopedia member photos",
});
</script>
