import { fileURLToPath } from 'node:url'
import { fetch, getServerLogs, setup } from '@nuxt/test-utils/e2e'
import { describe, expect, it } from 'vitest'

await setup({
  rootDir: fileURLToPath(new URL('../..', import.meta.url)),
  // Configure the fixture at build time and when its server starts.
  env: { NUXT_PUBLIC_GOOGLE_ANALYTICS_ID: 'G-TEST12345' },
  nuxtConfig: {
    runtimeConfig: { public: { googleAnalyticsId: 'G-TEST12345' } },
    // Exercise live SSR instead of prerendered HTML.
    routeRules: { '/**': { prerender: false } }
  },
  captureServerLogs: true
})

describe('configured analytics during SSR', () => {
  it('renders the home, blog and article routes without tracker errors', async () => {
    for (const path of [
      '/',
      '/blog',
      '/blog/migrating-kubernetes-pvcs-from-csi-proxmox-to-csi-cephfs'
    ]) {
      const response = await fetch(path)
      const html = await response.text()

      expect(response.status).toBe(200)
      // Verify that this request really has analytics enabled in runtime config.
      expect(html).toContain('G-TEST12345')
      expect(html).not.toContain('googletagmanager.com/gtag/js')
    }

    // Unhandled rejections and the subprocess log pipe can settle after a response.
    await new Promise(resolve => setTimeout(resolve, 50))
    expect(getServerLogs().join('\n')).not.toMatch(/unhandledRejection|Cannot use 'in' operator|vue-gtag|\[.*error.*\]/i)
  })
})
