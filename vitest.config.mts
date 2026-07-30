import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    include: ['test/nuxt/**/*.nuxt.spec.ts'],
    environmentOptions: {
      nuxt: {
        mock: {
          intersectionObserver: true
        }
      }
    }
  }
})
