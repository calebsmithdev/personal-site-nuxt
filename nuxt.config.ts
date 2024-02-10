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
    '@nuxt/content',
    '@vueuse/nuxt',
    '@nuxtjs/sitemap',
    'nuxt-simple-robots',
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
    Lora: [500],
    Poppins: [500, 700]
  },
  content: {
    documentDriven: true,
    highlight: {
      theme: {
        default: 'material-theme-lighter',
        dark: 'material-theme-palenight'
      },
      langs: ['json', 'js', 'ts', 'html', 'css', 'vue', 'shell', 'mdc', 'md', 'yaml', 'swift', 'php']
    }
  },
  site: {
    url: 'https://caleb-smith.dev',
  },
  build: {
    transpile: [
      'tslib',
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
