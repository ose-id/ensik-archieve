<script setup>
const { auth } = useSupabaseClient();
const supabase = useSupabaseClient();
const user = useSupabaseUser();
const userProfile = ref(null);
const links = [
  {
    title: 'Profile',
    to: 'profile',
  },
  {
    title: 'Post',
    to: 'post',
  },
];
const auths = [
  {
    title: 'Register',
    to: 'register',
  },
  {
    title: 'Login',
    to: 'login',
  },
];
async function userLogout() {
  await auth.signOut();
}

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
</script>

<template>
  <nav class="flex justify-between items-center tracking-widest px-12 pt-12">
    <NuxtLink to="/">
      <h1 class="text-xl lg:text-2xl font-extralight uppercase">
        Ensik Archieve
      </h1>
    </NuxtLink>
    <ul
      v-if="user"
      class="flex space-x-12"
    >
      <li
        v-for="(link, index) in links"
        :key="index"
      >
        <NuxtLink
          :to="`/${link.to}`"
          class="hover:text-blue-500"
        >
          {{ link.title }}
        </NuxtLink>
      </li>
    </ul>
    <button
      v-if="user"
      class="text-red-400 tracking-widest"
      @click="userLogout"
    >
      Logout
    </button>
    <ul
      v-else
      class="flex space-x-6"
    >
      <li
        v-for="(auth, index) in auths"
        :key="index"
      >
        <NuxtLink
          :to="`/${auth.to}`"
          class="hover:text-blue-500"
        >
          {{ auth.title }}
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>
