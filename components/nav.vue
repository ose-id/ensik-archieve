<template>
  <nav class="flex justify-between items-center tracking-widest px-12 pt-12">
    <NuxtLink to="/"><h1 class="text-xl lg:text-2xl font-extralight uppercase">Ensik Archieve</h1></NuxtLink>
    <ul class="flex space-x-12">
      <li>
        <NuxtLink to="/profile" class="hover:text-blue-500">Profile</NuxtLink>
      </li>
      <li>
        <NuxtLink to="/post" class="hover:text-blue-500">Post</NuxtLink>
      </li>
    </ul>
    <button @click="userLogout" class="text-red-400 tracking-widest" v-if="user">Logout</button>
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
const supabase = useSupabaseClient();
const user = useSupabaseUser();
const userProfile = ref(null);

async function fetchUserProfile() {
  if (user.value) {
    const { data, error } = await supabase.from("profiles").select("name").eq("email", user.value.email);

    if (error) {
      alert(error.message);
    } else {
      userProfile.value = data[0];
    }
  }
}

onMounted(() => {
  fetchUserProfile();
});

const userLogout = async () => {
  await auth.signOut();
};
</script>
