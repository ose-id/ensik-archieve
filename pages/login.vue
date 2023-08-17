<template>
    <div class="grid grid-cols-2">
        <div class="bg-[#146C94]">
            
        </div>
        <div>
            <section class="bg-white">
                <h1 class="font-bold">Login</h1>
                <NuxtLink to="/register" class="hover:text-[#146C94] text-[#19A7CE]">Register</NuxtLink>
            </section>
        </div>
    </div>
</template>

<script lang="ts" setup>
useSeoMeta({
  title: "Login - Ensik Archieve",
  description: "What is the Ensik Archive? To save some ensikolopedia member photos",
});
</script>