// https://nuxt.com/docs/guide/directory-structure/nuxt.config#nuxt-config-file
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxt/ui-pro',
    '@nuxtjs/mdc',
    '@sandros94/lab',
    '@vueuse/nuxt',
  ],

  devtools: { enabled: true },

  css: [
    'assets/css/main.css',
  ],

  future: {
    compatibilityVersion: 4,
  },

  eslint: {
    config: {
      stylistic: true,
    },
  },

  lab: {
    kv: true,
    zlib: true,
  },
})
