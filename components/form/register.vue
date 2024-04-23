<script setup>
const secDiv = 'lg:grid grid-cols-4 lg:flex items-center';
const label = 'col-span-1 text-[#146C94] font-medium text-xs lg:text-base';
const input = 'px-3 py-1.5 bg-white border border-slate-900 rounded-md w-full col-span-3 border-1 !border-[#146C94]';

const user = useSupabaseUser();
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const errorMsg = ref('');
const { auth } = useSupabaseClient();
async function userRegister() {
  if (password.value !== confirmPassword.value) {
    errorMsg.value = 'Passwords do not match!';
    password.value = '';
    confirmPassword.value = '';
    setTimeout(() => {
      errorMsg.value = '';
    }, 3000);
    return;
  }
  try {
    const { error } = await auth.signUp({
      email: email.value,
      password: password.value,
    });
    name.value = '';
    email.value = '';
    password.value = '';
    confirmPassword.value = '';
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
    return navigateTo('/update');
});
</script>

<template>
  <form class="flex flex-col space-y-8 lg:space-y-12" @submit.prevent="userRegister">
    <div :class="secDiv">
      <label for="email" :class="label">Email</label>
      <input id="email" v-model="email" type="text" name="email" :class="input">
    </div>
    <div :class="secDiv">
      <label for="password" :class="label">Password</label>
      <input id="password" v-model="password" type="password" name="password" :class="input">
    </div>
    <div :class="secDiv">
      <label for="password" :class="label">Confirm Password</label>
      <input id="password" v-model="confirmPassword" type="password" name="confirmPassword" :class="input">
    </div>
    <ButtonRegSub />
    {{ errorMsg }}
  </form>
</template>
