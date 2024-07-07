<script setup>
const inputStyle = 'mt-1 px-3 py-1.5 bg-white border border-slate-900 rounded-md';
const linkStyle = 'hover:text-[#146C94] text-[#19A7CE]';
const navigation = [
  { title: 'Forgot Password?', to: '/' },
  { title: 'Register', to: '/register' },
];

const user = useSupabaseUser();
const email = ref('');
const password = ref('');
const errorMsg = ref('');
const { auth } = useSupabaseClient();
async function userLogin() {
  try {
    const { error } = await auth.signInWithPassword({
      email: email.value,
      password: password.value,
    });
    email.value = '';
    password.value = '';
    if (error)
      throw error;
  }
  catch (error) {
    errorMsg.value = error.message;
    setTimeout(() => {
      errorMsg.value = '';
    }, 3000);
  }
}
watchEffect(() => {
  if (user.value)
    return navigateTo('/');
});
</script>

<template>
  <form
    class="flex flex-col min-w-[60%]"
    @submit.prevent="userLogin"
  >
    <label for="email">Email</label>
    <input
      id="email"
      v-model="email"
      type="email"
      name="email"
      :class="inputStyle"
    >
    <label
      for="password"
      class="mt-7"
    >Password</label>
    <input
      id="password"
      v-model="password"
      type="password"
      name="password"
      :class="inputStyle"
    >
    <div class="flex justify-between py-4">
      <NuxtLink
        v-for="item in navigation"
        :key="item.title"
        :to="item.to"
        :class="linkStyle"
      >
        {{ item.title }}
      </NuxtLink>
    </div>
    <ButtonLogSub />
  </form>
  <span class="text-red-400 text-center">{{ errorMsg }}</span>
</template>
