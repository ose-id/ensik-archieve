<template>
  <main class="bg-[#146C94] min-h-screen grid grid-rows-7 lg:grid-rows-5">
    <h1 class="font-bold uppercase text-2xl lg:text-5xl tracking-[5px] lg:tracking-[20px] text-white text-center my-12 lg:mt-12 2xl:mt-16 row-span-1">Register</h1>
    <section
      class="h-full bg-white rounded-t-[40px] lg:rounded-t-[50px] p-8 lg:pb-0 lg:pt-28 lg:px-36 2xl:py-32 2xl:px-40 shadow-[0_0_300px_0_rgba(0,0,0,0.3)] row-span-6 lg:row-span-4"
    >
      <FormRegister/>
    </section>
  </main>
</template>

<script lang="ts" setup>
useSeoMeta({
  title: "Register - Ensik Archieve",
  description: "What is the Ensik Archive? To save some ensikolopedia member photos",
});
</script>
