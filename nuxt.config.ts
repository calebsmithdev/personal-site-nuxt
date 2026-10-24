export default defineNuxtConfig({
  compatibilityDate: '2026-07-29',
  runtimeConfig: {
    public: {
      googleAnalyticsId: ''
    }
  },
  hooks: {
    'build:manifest': (manifest) => {
      // Keep optional analytics out of automatic preload and prefetch requests.
      for (const [id, entry] of Object.entries(manifest)) {
        if (id.includes('/vue-gtag/')) {
          entry.preload = false
          entry.prefetch = false
        }
      }
    }
  },
  vite: {
    define: {
      __DEV__: (process.env.NODE_ENV === 'development').toString()
    }
  },
  modules: [
    '@nuxt/content',
    '@nuxt/eslint',
    '@vueuse/nuxt',
    '@nuxtjs/sitemap',
    '@nuxtjs/robots'
  ],
  css: [
    '@fontsource/lora/500.css',
    '@fontsource/poppins/500.css',
    '@fontsource/poppins/700.css',
    '@fontsource/ibm-plex-mono/400.css',
    '@fontsource/ibm-plex-mono/500.css',
    '@/assets/css/typography.css'
  ],
  content: {
    build: {
      markdown: {
        toc: {
          depth: 3
        },
        highlight: {
          theme: 'material-theme-palenight',
          langs: ['json', 'js', 'ts', 'html', 'css', 'vue', 'shell', 'mdc', 'md', 'yaml', 'swift', 'php']
        }
      }
    }
  },
  site: {
    url: 'https://caleb-smith.dev'
  },
  features: {
    inlineStyles: true
  },
  experimental: {
    writeEarlyHints: false
  }
})
