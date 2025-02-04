<script setup lang="ts">
const { loggedIn, user, clear } = useUserSession();
</script>

<template>
  <nav class="mx-auto flexcenter py-6">
    <div
      v-if="loggedIn"
      class="flex items-center gap-2"
    >
      {{ user.username }}
      <ColorMode />
      <button
        class="cursor-pointer rounded border-none bg-transparent p-2 transition ease-in-out hover:bg-gray-100 dark:hover:bg-gray-700"
        aria-label="Logout"
        @click="clear"
      >
        <div class="i-mingcute:power-line text-xl text-red" />
      </button>
    </div>
    <div
      v-else
      class="flex items-center gap-2"
    >
      <ColorMode />
      <NuxtLink
        external
        class="flexcenter cursor-pointer gap-2 rounded-lg bg-indigo-500 text-white transition-colors ease-in-out hover:bg-indigo-600"
        to="/auth/discord"
        title="Sign In"
        p="~ x-4 y-2"
      >
        <div class="i-mingcute:discord-line size-5" /><span text-xs>Sign In</span>
      </NuxtLink>
    </div>
  </nav>
</template>
