<script setup lang="ts">
definePageMeta({
  layout: false,
});

useSeoMeta({
  title: 'Login - Ensik Archive',
});

const password = ref('');
const error = ref('');
const loading = ref(false);

async function handleSubmit() {
  error.value = '';
  loading.value = true;

  try {
    await $fetch('/api/auth/verify-password', {
      method: 'POST',
      body: { password: password.value },
    });
    navigateTo('/');
  }
  catch {
    error.value = 'Password salah. Silakan coba lagi.';
  }
  finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-zinc-950 px-4">
    <!-- Subtle gradient background -->
    <div class="pointer-events-none fixed inset-0 from-zinc-900 via-zinc-950 to-black bg-gradient-to-br" />

    <!-- Content -->
    <div class="z-10 max-w-[360px] w-full">
      <!-- Logo/Header -->
      <div class="mb-8 text-center">
        <div class="mx-auto mb-4 h-12 w-12 flex items-center justify-center rounded-xl bg-zinc-800 ring-1 ring-zinc-700/50">
          <svg class="h-6 w-6 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 class="text-xl text-zinc-100 font-semibold tracking-tight">
          Ensik Archive
        </h1>
        <p class="mt-1.5 text-sm text-zinc-500">
          Masukkan password untuk melanjutkan
        </p>
      </div>

      <!-- Card -->
      <div class="border border-zinc-800 rounded-lg bg-zinc-900/50 p-6 shadow-xl backdrop-blur-sm">
        <form class="space-y-4" @submit.prevent="handleSubmit">
          <!-- Password Field -->
          <div class="space-y-2">
            <label for="password" class="block text-sm text-zinc-300 font-medium">
              Password
            </label>
            <div class="relative">
              <input
                id="password"
                v-model="password"
                type="password"
                class="box-border h-10 w-full border border-zinc-800 rounded-md bg-zinc-950 px-3 text-sm text-zinc-100 outline-none transition-colors duration-200 focus:border-zinc-600 placeholder:text-zinc-600 focus:ring-1 focus:ring-zinc-600"
                placeholder="••••••••••••"
                autocomplete="current-password"
                required
              >
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="error" class="flex items-center gap-2 border border-red-900/50 rounded-md bg-red-950/50 px-3 py-2 text-sm text-red-400">
            <svg class="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {{ error }}
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            class="h-10 w-full flex cursor-pointer items-center justify-center gap-2 rounded-md bg-zinc-100 text-sm text-zinc-900 font-medium transition-colors duration-200 disabled:cursor-not-allowed hover:bg-zinc-200 disabled:opacity-50"
            :disabled="loading"
          >
            <svg v-if="loading" class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            {{ loading ? 'Memverifikasi...' : 'Masuk' }}
          </button>
        </form>
      </div>

      <!-- Footer -->
      <p class="mt-6 text-center text-xs text-zinc-600">
        Protected access • Ensik Archive
      </p>
    </div>
  </div>
</template>
