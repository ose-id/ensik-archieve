<template>
  <nuxt-img v-for="item in img" :class="imgStyle" :src="item.i" loading="lazy" alt="img" />
</template>

<script lang="ts" setup>
const imgStyle = "h-auto max-w-full rounded-lg";
const img = [
  { i: "https://flowbite.s3.amazonaws.com/docs/gallery/square/image.jpg" },
  { i: "https://flowbite.s3.amazonaws.com/docs/gallery/square/image-1.jpg" },
  { i: "https://flowbite.s3.amazonaws.com/docs/gallery/square/image-2.jpg" },
  { i: "https://flowbite.s3.amazonaws.com/docs/gallery/square/image-3.jpg" },
  { i: "https://flowbite.s3.amazonaws.com/docs/gallery/square/image-4.jpg" },
  { i: "https://flowbite.s3.amazonaws.com/docs/gallery/square/image-5.jpg" },
  { i: "https://flowbite.s3.amazonaws.com/docs/gallery/square/image-6.jpg" },
  { i: "https://flowbite.s3.amazonaws.com/docs/gallery/square/image-7.jpg" },
  { i: "https://flowbite.s3.amazonaws.com/docs/gallery/square/image-8.jpg" },
  { i: "https://flowbite.s3.amazonaws.com/docs/gallery/square/image-9.jpg" },
  { i: "https://flowbite.s3.amazonaws.com/docs/gallery/square/image-10.jpg" },
  { i: "https://flowbite.s3.amazonaws.com/docs/gallery/square/image-11.jpg" },
];
</script>
