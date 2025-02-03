export default defineNuxtConfig({

  modules: [
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxthub/core',
    '@unocss/nuxt',
    '@vueuse/nuxt',
    'nuxt-auth-utils',
  ],

  devtools: {
    enabled: false,
  }, app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      htmlAttrs: {
        lang: 'en',
      },
    },
  },

  runtimeConfig: {
    oauth: {
      discord: {
        clientId: process.env.NUXT_OAUTH_DISCORD_CLIENT_ID,
        clientSecret: process.env.NUXT_OAUTH_DISCORD_CLIENT_SECRET,
        scope: ['identify', 'guilds.members.read'],
      },
    },
    session: {
      maxAge: 60 * 60 * 24 * 7,
    },
  },

  routeRules: {
    '/': { appMiddleware: 'auth' },
  },

  compatibilityDate: '2024-07-08',

  hub: {
    blob: true,
  },

  eslint: {
    config: {
      stylistic: {
        semi: true,
      },
    },
  },
});
