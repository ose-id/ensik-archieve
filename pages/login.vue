<template>
  <div class="h-screen">
    <div class="grid lg:grid-cols-2">
      <div class="bg-[#146C94] w-full h-screen hidden lg:block"></div>
      <div class="bg-[#146C94]">
        <div class="w-full h-screen flex flex-col justify-center items-center space-y-12 bg-white lg:rounded-l-3xl shadow-[0_0_300px_0_rgba(0,0,0,0.3)]">
          <h1 class="font-bold uppercase text-5xl tracking-wider text-center">Login</h1>
          <FormLogin />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
useSeoMeta({
  title: "Login - Ensik Archieve",
  description: "What is the Ensik Archive? To ave some ensikolopedia member photos",
});
</script>
