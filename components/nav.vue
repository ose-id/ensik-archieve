<template>
  <nav class="flex justify-between items-center tracking-widest px-12 pt-12">
    <NuxtLink to="/"><h1 class="text-xl lg:text-2xl font-extralight uppercase">Ensik Archieve</h1></NuxtLink>
    <ul class="flex space-x-12" v-if="user">
      <li v-for="(link, index) in links" :key="index">
        <NuxtLink :to="'/' + link.to" class="hover:text-blue-500">{{ link.title }}</NuxtLink>
      </li>
    </ul>
    <button @click="userLogout" class="text-red-400 tracking-widest" v-if="user">Logout</button>
    <ul class="flex space-x-6" v-else>
      <li v-for="(auth, index) in auths" :key="index">
        <NuxtLink :to="'/' + auth.to" class="hover:text-blue-500">{{ auth.title }}</NuxtLink>
      </li>
    </ul>
  </nav>
</template>

<script setup>
const { auth } = useSupabaseClient();
const supabase = useSupabaseClient();
const user = useSupabaseUser();
const userProfile = ref(null);
const links = [
  {
    title: "Profile",
    to: "profile",
  },
  {
    title: "Post",
    to: "post",
  },
];
const auths = [
  {
    title: "Register",
    to: "register",
  },
  {
    title: "Login",
    to: "login",
  },
];
const userLogout = async () => {
  await auth.signOut();
};

const fetchUserProfile = async () => {
  if (user.value) {
    const { data, error } = await supabase.from("profiles").select("name").eq("email", user.value.email);

    if (error) {
      alert(error.message);
    } else {
      userProfile.value = data[0];
    }
  }
};

onMounted(() => {
  fetchUserProfile();
});
</script>
