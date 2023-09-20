<template>
  <section class="flex items-center justify-center mx-auto container min-h-screen">
    <div class="space-y-4 flex flex-col" v-if="userProfile">
      <h1>Name: {{ userProfile.name }}</h1>
      <p>Email: {{ user.email }}</p>
      <NuxtLink to="/profile/update" class="py-2 px-3 bg-blue-300 rounded-md my-2 text-center">Update</NuxtLink>
    </div>
  </section>
</template>

<script setup>
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
</script>
