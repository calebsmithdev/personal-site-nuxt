import graphql from '@rollup/plugin-graphql'
export default defineNuxtConfig({
  imports: {
    dirs: ['graphql']
  },
  runtimeConfig: {
    public: {
      wordpressBaseUrl: '',
      googleAnalyticsId: ''
    }
  },
  vite: {
    plugins: [graphql()],
    define: {
      __DEV__: (process.env.NODE_ENV === 'development').toString()
    }
  },
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/color-mode',
    'nuxt-content-assets',
    '@nuxt/content',
    '@vueuse/nuxt'
  ],
  colorMode: {
    // preference: 'system', // default value of $colorMode.preference
    preference: 'dark',
    fallback: 'dark'
  },
  buildModules: [
    '@nuxtjs/google-fonts'
  ],
  css: [
    '@/assets/css/typography.css',
    '@fortawesome/fontawesome-svg-core/styles.css'
  ],
  families: {
    Inter: [300, 400, 500, 700],
    Montserrat: [300, 500, 600],
    'IBM Plex Mono': [400]
  },
  content: {
    highlight: {
      theme: {
        default: 'material-theme-lighter',
        dark: 'material-theme-palenight'
      },
      langs: ['json', 'js', 'ts', 'html', 'css', 'vue', 'shell', 'mdc', 'md', 'yaml', 'swift', 'php']
    }
  },
  build: {
    transpile: [
      '@apollo/client',
      'ts-invariant/process',
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
