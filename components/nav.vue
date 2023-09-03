<template>
  <nav class="flex justify-center">
    <ul class="flex space-x-6" v-if="user">
      <li>
        {{ user.name }}
      </li>
      <li>
        <button @click="userLogout">Logout</button>
      </li>
    </ul>
    <ul class="flex space-x-6" v-else>
      <li>
        <NuxtLink to="/register" class="hover:text-blue-500">REGISTER</NuxtLink>
      </li>
      <li><NuxtLink to="/login" class="hover:text-blue-500">LOGIN</NuxtLink></li>
    </ul>
  </nav>
</template>

<script setup>
const { auth } = useSupabaseClient();
const user = useSupabaseUser();
const userLogout = async () => {
  await auth.signOut();
};
</script>
