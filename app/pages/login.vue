<script setup vapor lang="ts">
definePageMeta({
  layout: false,
  // Redirect in middleware rather than with a top-level `await` in setup,
  // which would cost this Vapor page its Nuxt context.
  middleware: () => {
    const { loggedIn, session } = useUserSession();
    if (loggedIn.value || session.value?.siteAuthenticated)
      return navigateTo('/');
  },
});

useSeoMeta({
  title: 'Login - Ensik Archive',
});

const { fetch: fetchSession } = useUserSession();

const password = ref('');
const showPassword = ref(false);
const error = ref('');
const loading = ref(false);
const capsLock = ref(false);

watch(password, () => {
  error.value = '';
});

function trackCapsLock(event: KeyboardEvent) {
  capsLock.value = event.getModifierState?.('CapsLock') ?? false;
}

async function handleSubmit() {
  error.value = '';
  loading.value = true;

  try {
    await $fetch('/api/auth/verify-password', {
      method: 'POST',
      body: { password: password.value },
    });

    await fetchSession();
    await navigateTo('/');
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
  <div class="px-4 py-10 bg-zinc-950 flex flex-col items-center justify-center min-h-dvh">
    <div class="pointer-events-none inset-0 fixed from-zinc-900 to-black via-zinc-950 bg-gradient-to-br" />

    <div class="max-w-[380px] w-full z-10">
      <div class="mb-8 text-center">
        <div class="mx-auto mb-4 rounded-2xl bg-zinc-800/80 flex size-12 ring-1 ring-zinc-700/60 items-center justify-center">
          <span class="i-mingcute:lock-line text-zinc-200 size-6" aria-hidden="true" />
        </div>
        <h1 class="text-2xl text-zinc-100 tracking-tight font-semibold">
          Ensik Archive
        </h1>
        <p class="text-sm text-zinc-400 mt-1.5">
          Masukkan password untuk melanjutkan
        </p>
      </div>

      <div class="p-5 border border-zinc-800/80 rounded-2xl bg-zinc-900/60 shadow-2xl backdrop-blur-xs sm:p-7">
        <form class="space-y-5" novalidate @submit.prevent="handleSubmit">
          <div class="space-y-2">
            <label for="password" class="text-sm text-zinc-200 font-medium block">
              Password
            </label>
            <AtomsInput
              id="password"
              v-model="password"
              icon="i-mingcute:key-2-line"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Masukkan password"
              autocomplete="current-password"
              :invalid="Boolean(error)"
              :describedby="error ? 'password-error' : capsLock ? 'password-capslock' : undefined"
              required
              @keydown="trackCapsLock"
              @keyup="trackCapsLock"
            >
              <template #trailing>
                <button
                  type="button"
                  class="text-zinc-400 rounded-lg flex size-9 cursor-pointer transition-colors items-center justify-center hover:(text-zinc-100 bg-zinc-800) focus-visible:outline-2 focus-visible:outline-zinc-400"
                  :aria-label="showPassword ? 'Sembunyikan password' : 'Tampilkan password'"
                  :aria-pressed="showPassword"
                  @click="showPassword = !showPassword"
                >
                  <span
                    class="size-5"
                    :class="showPassword ? 'i-mingcute:eye-close-line' : 'i-mingcute:eye-2-line'"
                    aria-hidden="true"
                  />
                </button>
              </template>
            </AtomsInput>

            <p v-if="error" id="password-error" class="text-sm text-red-400 flex gap-1.5 items-center" role="alert">
              <span class="i-mingcute:warning-line shrink-0 size-4" aria-hidden="true" />
              {{ error }}
            </p>
            <p v-else-if="capsLock" id="password-capslock" class="text-sm text-amber-400 flex gap-1.5 items-center">
              <span class="i-mingcute:arrow-up-circle-line shrink-0 size-4" aria-hidden="true" />
              Caps Lock aktif
            </p>
          </div>

          <button
            type="submit"
            class="text-base text-zinc-900 font-semibold rounded-xl bg-zinc-100 flex gap-2 h-12 w-full cursor-pointer transition-[background-color,opacity] items-center justify-center focus-visible:(outline-2 outline-zinc-400 outline-offset-2) hover:bg-white disabled:(opacity-50 cursor-not-allowed)"
            :disabled="loading || !password"
          >
            <span v-if="loading" class="i-mingcute:loading-fill size-5 animate-spin" aria-hidden="true" />
            {{ loading ? 'Memverifikasi…' : 'Masuk' }}
          </button>
        </form>
      </div>

      <p class="text-xs text-zinc-500 mt-6 text-center flex gap-1.5 items-center justify-center">
        <span class="i-mingcute:shield-line size-3.5" aria-hidden="true" />
        Akses terbatas untuk anggota Ensik
      </p>
    </div>
  </div>
</template>
