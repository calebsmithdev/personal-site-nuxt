import { securityHeaders } from './config/security-headers'

export default defineNuxtConfig({
  modules: [
    '@nuxt/content',
    '@nuxt/eslint',
    '@nuxtjs/sitemap',
    '@nuxtjs/robots'
  ],
  css: [
    '@fontsource/lora/500.css',
    '@fontsource/poppins/500.css',
    '@fontsource/poppins/700.css',
    '@fontsource/ibm-plex-mono/400.css',
    '@fontsource/ibm-plex-mono/500.css',
    '@/assets/css/reset.css',
    '@/assets/css/typography.css'
  ],
  site: {
    url: 'https://caleb-smith.dev'
  },
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
  runtimeConfig: {
    public: {
      googleAnalyticsId: ''
    }
  },
  // Static hosting must apply these headers at the host/edge; see README.
  routeRules: {
    '/**': { headers: securityHeaders }
  },
  features: {
    inlineStyles: true
  },
  experimental: {
    writeEarlyHints: false
  },
  compatibilityDate: '2026-07-29',
  nitro: {
    prerender: {
      // Discover rendered image URLs in Node builds as well as generate output.
      routes: ['/blog'],
      crawlLinks: true
    }
  },
  typescript: {
    nodeTsConfig: {
      include: ['../content.config.ts', '../vitest.config.mts', '../config/**/*.ts', '../test/unit/**/*.ts', '../test/e2e/**/*.ts', '../scripts/**/*.ts', '../test/generated/**/*.ts'],
      compilerOptions: { types: ['node'] }
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
  eslint: {
    config: {
      stylistic: { commaDangle: 'never', quoteProps: 'as-needed' },
      formatters: { css: true }
    }
  }
})
