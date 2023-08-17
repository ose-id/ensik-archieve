<template>
    <div class="container mx-auto">
        <div class="grid grid-cols-2 ">
            <div class="bg-[#146C94] w-full">

            </div>
            <div class="w-full">
                <section class="bg-white pt-7">
                    <h1 class="font-bold uppercase text-5xl tracking-[20px] text-b text-center">Login</h1>
                    <form>
                        <label class="block">
                            <span class="block text-sm">Username</span>
                            <input type="text" value="" class="mt-1 w-auto px-3 py-0.5 bg-white border border-slate-900 rounded-sm" />
                        </label>
                        <label class="block mt-6">
                            <span class="block text-sm">Password</span>
                            <input type="password" value="" class="mt-1 w-auto px-3 py-0.5 bg-white border border-slate-900 rounded-sm" />
                        </label>
                    </form>
                    <NuxtLink to="/register" class="hover:text-[#146C94] text-[#19A7CE]">Register</NuxtLink>
                </section>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
useSeoMeta({
  title: "Login - Ensik Archieve",
  description: "What is the Ensik Archive? To save some ensikolopedia member photos",
});
</script>