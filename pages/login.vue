<template>
  <div class="h-screen">
    <div class="grid lg:grid-cols-2">
      <div class="bg-[#146C94] w-full h-screen hidden lg:block"></div>
      <div class="bg-[#146C94]">
        <div class="w-full h-screen flex flex-col justify-center items-center space-y-12 bg-white lg:rounded-l-3xl shadow-[0_0_300px_0_rgba(0,0,0,0.3)]">
          <h1 class="font-bold uppercase text-5xl tracking-wider text-center">Login</h1>
          <form class="flex flex-col min-w-[60%]">
            <label for="email">Email</label>
            <input id="email" type="text" :class="inputStyle" />
            <label for="password" class="mt-7">Password</label>
            <input id="password" type="password" :class="inputStyle" />
            <div class="flex justify-between py-4">
              <NuxtLink v-for="item in navigation" :key="item.title" :to="item.to" :class="linkStyle">{{ item.title }}</NuxtLink>
            </div>
            <ButtonLogSub/>
          </form>
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

const inputStyle = "mt-1 px-3 py-1.5 bg-white border border-slate-900 rounded-md";
const linkStyle = "hover:text-[#146C94] text-[#19A7CE]";
const navigation = [
  { title: "Forgot Password?", to: "/" },
  { title: "Register", to: "/register" },
];
</script>
