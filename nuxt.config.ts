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

  devtools: { enabled: true },

  css: [
    'assets/css/main.css',
  ],

  runtimeConfig: {
    public: {
      ws: {
        path: '_ws',
        channels: {
          internal: ['_internal'] as const,
          available: ['notifications'] as const,
        },
      },
    },
  },

  future: {
    compatibilityVersion: 4,
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
    kv: {
      ttl: 10 * 60 * 60,
    },
    zlib: true,
  },
})
