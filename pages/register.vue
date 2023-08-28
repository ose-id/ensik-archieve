<template>
  <main class="bg-[#146C94] w-full pt-10 font-Poppins">
    <h1 class="font-bold uppercase text-5xl tracking-[20px] text-white text-center py-12">Register</h1>
    <section class="w-full rounded-t-[50px] bg-white mt-10 py-32 px-40">
      <form class="flex flex-col space-y-12">
        <div :class="secDiv">
          <label for="name" :class="label">Name</label>
          <input id="name" type="text" :class="input" maxlength="30"/>
        </div>
        <div :class="secDiv">
          <label for="email" :class="label">Email</label>
          <input id="email" type="text" :class="input" />
        </div>
        <div :class="secDiv">
          <label for="username" :class="label">Username</label>
          <input id="username" type="text" :class="input" maxlength="10"/>
        </div>
        <div :class="secDiv">
          <label for="password" :class="label">Password</label>
          <input id="password" type="password" :class="input" />
        </div>
        <button class="mx-auto text-[#146C94] border-2 border-[#146C94] rounded-lg py-2 px-20 !mt-32">Register</button>
      </form>
    </section>
  </main>
</template>

<script lang="ts" setup>
useSeoMeta({
  title: "Register - Ensik Archieve",
  description: "What is the Ensik Archive? To save some ensikolopedia member photos",
});

const secDiv = "grid grid-cols-4 flex items-center";
const label = "col-span-1 text-[#146C94] font-semibold";
const input = "px-3 py-1.5 bg-white border border-slate-900 rounded-md w-full col-span-3 border-1 !border-[#146C94]";
</script>
