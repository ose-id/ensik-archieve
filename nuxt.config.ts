/* eslint-disable node/prefer-global/process */
export default defineNuxtConfig({

  modules: [
    '@nuxt/image',
    '@nuxtjs/color-mode',
    '@unocss/nuxt',
    '@vueuse/nuxt',
    'nuxt-auth-utils',
  ],

  routeRules: {
    '/': {
      isr: 3600,
    },
  },

  devtools: {
    enabled: false,
  },

  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      htmlAttrs: {
        lang: 'en',
      },
      meta: [
        { name: 'keywords', content: 'Ensik Archive is a captivating online gallery platform dedicated to preserving and showcasing a rich collection of historical, and documents.' },
        { name: 'author', content: 'OSE' },
        { name: 'apple-mobile-web-app-title', content: 'Ensik Arch' },
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon/favicon-96x96.png', sizes: '96x96' },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon/favicon.svg' },
        { rel: 'shortcut icon', href: 'favicon.ico' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/favicon/apple-touch-icon.png' },
        { rel: 'manifest', href: '/favicon/site.webmanifest' },
      ],
    },
  },

  colorMode: {
    classSuffix: '',
    preference: 'light',
  },

  runtimeConfig: {
    oauth: {
      discord: {
        clientId: process.env.NUXT_OAUTH_DISCORD_CLIENT_ID,
        clientSecret: process.env.NUXT_OAUTH_DISCORD_CLIENT_SECRET,
        scope: ['identify', 'guilds.members.read'],
      },
    },
    public: {
      authJs: {
        baseURL: process.env.AUTH_ORIGIN,
      },
    },
  },

  compatibilityDate: '2024-07-08',
});
