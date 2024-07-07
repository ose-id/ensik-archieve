<script setup>
const router = useRouter();
const name = ref('');
const user = useSupabaseUser();
const userProfile = ref(null);
const supabase = useSupabaseClient();

async function fetchUserProfile() {
  if (user.value) {
    const { data, error } = await supabase.from('profiles').select('name').eq('email', user.value.email);

    if (error)
      alert(error.message);
    else
      userProfile.value = data[0];
  }
}

onMounted(() => {
  fetchUserProfile();
});

async function updateProfile() {
  try {
    const { error } = await supabase.from('profiles').upsert([
      {
        name: name.value,
        email: user.value.email,
        updated_at: new Date(),
      },
    ]);

    if (error)
      throw error;

    router.push('/profile');
  }
  catch (error) {
    alert(error.message);
  }
}
</script>

<template>
  <section class="flex items-center justify-center mx-auto container min-h-screen px-4">
    <form
      v-if="userProfile"
      class="space-y-4 flex flex-col w-full lg:w-[30%]"
      @submit.prevent="updateProfile"
    >
      <p>Name: {{ userProfile.name }}</p>
      <input
        id="name"
        v-model="name"
        type="text"
      >
      <input
        id="email"
        type="text"
        :value="user.email"
        disabled
      >
      <button
        type="submit"
        class="bg-black text-white p-2"
      >
        Update Profile
      </button>
    </form>
  </section>
</template>
