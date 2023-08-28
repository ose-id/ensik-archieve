// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      charset: "utf-8",
      viewport: "width=device-width, initial-scale=1",
      htmlAttrs: {
        lang: "en",
      },
    },
  },
  
  modules: [
    // "@nuxtjs/supabase",
    "@nuxtjs/google-fonts",
    "@nuxt/image",
  ],

  devtools: { enabled: true },

  css: ["~/assets/css/main.css"],
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

  image: {
    quality: 1,
    format: ['webp']
  },

  googleFonts: {
    families: {
      Poppins: [100, 200, 300, 400, 500, 600, 700],
    },
    display: "swap",
    prefetch: true,
    preconnect: true,
  },
});
