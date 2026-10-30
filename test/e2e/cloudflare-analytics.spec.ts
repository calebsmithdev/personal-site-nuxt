import { fileURLToPath } from 'node:url'
import { fetch, getServerLogs, setup } from '@nuxt/test-utils/e2e'
import { describe, expect, it } from 'vitest'

await setup({
  rootDir: fileURLToPath(new URL('../..', import.meta.url)),
  // Configure the fixture at build time and when its server starts.
  env: { NUXT_PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN: 'test-cloudflare-token' },
  nuxtConfig: {
    runtimeConfig: { public: { cloudflareAnalyticsToken: 'test-cloudflare-token' } },
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
      expect(html).toContain('test-cloudflare-token')
      const script = html.match(/<script[^>]*src="https:\/\/static.cloudflareinsights.com\/beacon.min.js"[^>]*>/)?.[0]
      expect(script).toBeDefined()
      expect(script).toMatch(/\sdefer(?:[\s=>])/)
      expect(script).toContain('data-cf-beacon="{&quot;token&quot;:&quot;test-cloudflare-token&quot;}"')
      expect(html).not.toMatch(/<link[^>]*href="https:\/\/static.cloudflareinsights.com/)
    }

    // Unhandled rejections and the subprocess log pipe can settle after a response.
    await new Promise(resolve => setTimeout(resolve, 50))
    expect(getServerLogs().join('\n')).not.toMatch(/unhandledRejection|Cannot use 'in' operator|\[.*error.*\]/i)
  })
})
