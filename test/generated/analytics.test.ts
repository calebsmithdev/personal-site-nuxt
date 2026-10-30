import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { Window } from 'happy-dom'

await test('static pages only include the deferred beacon when configured', async () => {
  const window = new Window({
    url: 'https://caleb-smith.dev',
    settings: {
      disableJavaScriptEvaluation: true,
      disableJavaScriptFileLoading: true,
      disableCSSFileLoading: true
    }
  })
  try {
    for (const path of ['index.html', 'blog/index.html']) {
      const html = await readFile(new URL(`../../.output/public/${path}`, import.meta.url), 'utf8')
      const document = new window.DOMParser().parseFromString(html, 'text/html')
      const scripts = document.querySelectorAll('script[src*="cloudflareinsights.com"]')
      const token = process.env.NUXT_PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN
      assert.equal(scripts.length, token ? 1 : 0)
      if (token) {
        const script = scripts[0]!
        assert.equal(script.getAttribute('src'), 'https://static.cloudflareinsights.com/beacon.min.js')
        assert.ok(script.hasAttribute('defer'))
        assert.equal(script.getAttribute('data-cf-beacon'), JSON.stringify({ token }))
      }
      assert.equal(document.querySelectorAll('link[href*="cloudflareinsights.com"]').length, 0)
    }
  }
  finally {
    await window.happyDOM.close()
  }
})
