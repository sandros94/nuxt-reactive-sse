// https://nuxt.com/docs/guide/directory-structure/nuxt.config#nuxt-config-file
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui-pro',
    '@nuxtjs/mdc',
    '@sandros94/lab',
    '@vueuse/nuxt',
    'nuxt-auth-utils',
  ],

  ssr: false,

  devtools: { enabled: true },

  css: [
    'assets/css/main.css',
  ],

  future: {
    compatibilityVersion: 4,
  },

  experimental: {
    buildCache: true,
  },

  compatibilityDate: '2025-01-08',

  nitro: {
    experimental: {
      websocket: true,
    },
  },

  eslint: {
    config: {
      stylistic: true,
    },
  },

  lab: {
    ws: {
      route: '_ws',
      channels: {
        internal: ['_internal', 'notifications'],
        defaults: ['session'],
      },
    },
  },
})
