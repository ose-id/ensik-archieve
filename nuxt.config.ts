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

  modules: ["@nuxtjs/supabase", "@nuxtjs/tailwindcss", "@nuxtjs/google-fonts", "@nuxt/image"],

  devtools: { enabled: false },

  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY,
    redirectOptions: {
      login: "/login",
      callback: "/confirm",
      exclude: ["/", "/register"],
    },
  },

  image: {
    quality: 1,
    format: ["webp"],
  },

  googleFonts: {
    families: {
      Quicksand: [300, 400, 700],
    },
    display: "swap",
    prefetch: true,
    preconnect: true,
  },
});
