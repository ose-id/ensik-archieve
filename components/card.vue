<template>
  <nuxt-img v-for="item in img" :key="item.i" :src="item.i" :class="imgStyle" loading="lazy" alt="img" placeholder />
</template>

<script setup>
const imgStyle = "h-auto max-w-full rounded-lg";
const img = Array.from({ length: 12 }, (_, i) => ({
  i: i === 0 ? `https://flowbite.s3.amazonaws.com/docs/gallery/square/image.jpg` : `https://flowbite.s3.amazonaws.com/docs/gallery/square/image-${i}.jpg`,
}));
</script>
