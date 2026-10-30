import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { Window } from 'happy-dom'

const beaconSrc = 'https://static.cloudflareinsights.com/beacon.min.js'
const readPage = async (path: string) => readFile(new URL(`../../.output/public/${path}`, import.meta.url), 'utf8')
// Read the token the build actually used. `nuxi generate` loads .env, but this
// test process only sees the shell environment, so process.env can disagree.
const configuredToken = (html: string) => {
  const match = /cloudflareAnalyticsToken:"([^"]*)"/.exec(html)
  assert.ok(match, 'Expected the generated runtime config to include cloudflareAnalyticsToken')
  return match[1]!
}

await test('prerendered pages include the module beacon only when configured', async () => {
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
      const html = await readPage(path)
      const token = configuredToken(html)
      const document = new window.DOMParser().parseFromString(html, 'text/html')
      const scripts = document.querySelectorAll('script[src*="cloudflareinsights.com"]')
      assert.equal(scripts.length, token ? 1 : 0, path)
      if (token) {
        const script = scripts[0]!
        assert.equal(script.getAttribute('src'), beaconSrc)
        assert.equal(script.getAttribute('type'), 'module')
        assert.equal(script.getAttribute('data-cf-beacon'), JSON.stringify({ token }))
      }
      assert.equal(document.querySelectorAll('link[href*="cloudflareinsights.com"]').length, 0, path)
    }
  }
  finally {
    await window.happyDOM.close()
  }
})
