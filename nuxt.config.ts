export default defineNuxtConfig({
  modules: [
    '@nuxt/fonts',
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
      viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
      htmlAttrs: {
        lang: 'id',
      },
      meta: [
        { name: 'description', content: 'Galeri privat untuk menyimpan dan menampilkan arsip gambar komunitas Ensik.' },
        { name: 'keywords', content: 'Ensik Archive, galeri, arsip gambar, komunitas' },
        { name: 'author', content: 'OSE' },
        { name: 'apple-mobile-web-app-title', content: 'Ensik Archive' },
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon/favicon-96x96.png', sizes: '96x96' },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon/favicon.svg' },
        { rel: 'shortcut icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/favicon/apple-touch-icon.png' },
        { rel: 'manifest', href: '/favicon/site.webmanifest' },
      ],
    },
  },

  colorMode: {
    classSuffix: '',
    preference: 'light',
  },

  fonts: {
    defaults: {
      formats: ['woff2'],
      styles: ['normal'],
      subsets: ['latin'],
    },
    families: [
      {
        name: 'Outfit',
        provider: 'google',
        weights: [400, 500, 600, 700],
        global: true,
      },
      {
        name: 'Hi Melody',
        provider: 'fontsource',
        weights: [400],
        global: true,
      },
    ],
  },

  image: {
    domains: [
      'cdn.discordapp.com',
    ],
    providers: {
      ensik: {
        provider: '~/providers/ensik.ts',
      },
    },
    screens: {
      'xs': 320,
      'sm': 480,
      'md': 640,
      'lg': 768,
      'xl': 1024,
      'xxl': 1280,
      '2xl': 1536,
      '3xl': 1920,
    },
  },

  runtimeConfig: {
    sitePasswordHash: '',
    discordGuildId: '',
    discordRoleId: '',
    discordRoleRecheckSeconds: 900,
    oauth: {
      discord: {
        clientId: '',
        clientSecret: '',
        scope: ['identify', 'guilds.members.read'],
      },
    },
    session: {
      password: '',
      maxAge: 604800,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: !import.meta.dev,
      },
    },
  },

  compatibilityDate: '2024-07-08',
});
