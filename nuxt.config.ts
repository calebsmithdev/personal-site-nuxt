export default defineNuxtConfig({
  compatibilityDate: '2026-07-29',
  runtimeConfig: {
    public: {
      googleAnalyticsId: ''
    }
  },
  vite: {
    define: {
      __DEV__: (process.env.NODE_ENV === 'development').toString()
    }
  },
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/color-mode',
    '@nuxt/content',
    '@nuxt/eslint',
    '@vueuse/nuxt',
    '@nuxtjs/sitemap',
    '@nuxtjs/robots'
  ],
  colorMode: {
    // preference: 'system', // default value of $colorMode.preference
    preference: 'dark',
    fallback: 'dark'
  },
  css: [
    '@fontsource/lora/500.css',
    '@fontsource/poppins/500.css',
    '@fontsource/poppins/700.css',
    '@/assets/css/typography.css',
    '@fortawesome/fontawesome-svg-core/styles.css'
  ],
  content: {
    build: {
      markdown: {
        toc: {
          depth: 3
        },
        highlight: {
          theme: {
            default: 'material-theme-lighter',
            dark: 'material-theme-palenight'
          },
          langs: ['json', 'js', 'ts', 'html', 'css', 'vue', 'shell', 'mdc', 'md', 'yaml', 'swift', 'php']
        }
      }
    }
  },
  site: {
    url: 'https://caleb-smith.dev'
  },
  build: {
    transpile: [
      'tslib',
      '@fortawesome/fontawesome-svg-core',
      '@fortawesome/free-brands-svg-icons',
      '@fortawesome/free-regular-svg-icons',
      '@fortawesome/free-solid-svg-icons',
      '@fortawesome/vue-fontawesome'
    ]
  },
  experimental: {
    writeEarlyHints: false
  }
})
