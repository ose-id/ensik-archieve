<template>
  <main class="container mx-auto py-12">
    <nav class="flex justify-center">
      <ul class="flex space-x-6">
        <li>
          <NuxtLink to="/register" class="hover:text-blue-500">REGISTER</NuxtLink>
        </li>
        <li><NuxtLink to="/login" class="hover:text-blue-500">LOGIN</NuxtLink></li>
      </ul>
    </nav>
    <div class="grid grid-cols-2 md:grid-cols-3 gap-8 py-12">
      <img class="h-auto max-w-full rounded-lg" src="https://flowbite.s3.amazonaws.com/docs/gallery/square/image.jpg" loading="lazy" alt="" />
      <img class="h-auto max-w-full rounded-lg" src="https://flowbite.s3.amazonaws.com/docs/gallery/square/image-1.jpg" loading="lazy" alt="" />
      <img class="h-auto max-w-full rounded-lg" src="https://flowbite.s3.amazonaws.com/docs/gallery/square/image-2.jpg" loading="lazy" alt="" />
      <img class="h-auto max-w-full rounded-lg" src="https://flowbite.s3.amazonaws.com/docs/gallery/square/image-3.jpg" loading="lazy" alt="" />
      <img class="h-auto max-w-full rounded-lg" src="https://flowbite.s3.amazonaws.com/docs/gallery/square/image-4.jpg" loading="lazy" alt="" />
      <img class="h-auto max-w-full rounded-lg" src="https://flowbite.s3.amazonaws.com/docs/gallery/square/image-5.jpg" loading="lazy" alt="" />
      <img class="h-auto max-w-full rounded-lg" src="https://flowbite.s3.amazonaws.com/docs/gallery/square/image-6.jpg" loading="lazy" alt="" />
      <img class="h-auto max-w-full rounded-lg" src="https://flowbite.s3.amazonaws.com/docs/gallery/square/image-7.jpg" loading="lazy" alt="" />
      <img class="h-auto max-w-full rounded-lg" src="https://flowbite.s3.amazonaws.com/docs/gallery/square/image-8.jpg" loading="lazy" alt="" />
      <img class="h-auto max-w-full rounded-lg" src="https://flowbite.s3.amazonaws.com/docs/gallery/square/image-9.jpg" loading="lazy" alt="" />
      <img class="h-auto max-w-full rounded-lg" src="https://flowbite.s3.amazonaws.com/docs/gallery/square/image-10.jpg" loading="lazy" alt="" />
      <img class="h-auto max-w-full rounded-lg" src="https://flowbite.s3.amazonaws.com/docs/gallery/square/image-11.jpg" loading="lazy" alt="" />
    </div>
  </main>
</template>

<script lang="ts" setup>
useSeoMeta({
  title: "Ensik Archieve",
  description: "What is the Ensik Archive? To save some ensikolopedia member photos",
});
</script>
