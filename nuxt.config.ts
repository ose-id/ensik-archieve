/* eslint-disable node/prefer-global/process */
export default defineNuxtConfig({

  modules: [
    '@nuxt/image',
    '@nuxtjs/color-mode',
    '@unocss/nuxt',
    '@vueuse/nuxt',
    'nuxt-auth-utils',
  ],

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
  },

  routeRules: {
    '/': { appMiddleware: 'auth' },
  },

  compatibilityDate: '2024-07-08',
});
