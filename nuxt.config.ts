export default defineNuxtConfig({
  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      htmlAttrs: {
        lang: 'en',
      },
    },
  },

  modules: [
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxtjs/supabase',
    '@nuxtjs/tailwindcss',
    '@nuxtjs/google-fonts',
  ],

  devtools: { enabled: false },

  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY,
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      exclude: ['/', '/register'],
    },
  },

  eslint: {
    config: {
      stylistic: {
        semi: true,
      },
    },
  },

  image: {
    quality: 30,
    format: ['webp'],
  },

  tailwindcss: {
    viewer: false,
  },

  googleFonts: {
    families: {
      Quicksand: [300, 400, 700],
    },
    display: 'swap',
    prefetch: true,
    preconnect: true,
  },

  compatibilityDate: '2024-07-08',
});
