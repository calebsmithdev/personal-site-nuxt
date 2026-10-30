import { describe, expect, it } from 'vitest'
import { checkAssetCache, discoverAssets, policyErrors } from '../../scripts/check-asset-cache.ts'

const immutable = 'public, max-age=31536000, immutable'

describe('deployed asset cache validation', () => {
  it('accepts a browser year with immutable regardless of directive order or case', () => {
    expect(policyErrors('Immutable, max-age="31536000", PUBLIC, s-maxage=60', true)).toEqual([])
  })

  it.each([
    'public, max-age=14400, s-maxage=31536000',
    'max-age=300',
    'public, s-maxage=31536000, immutable',
    `${immutable}, no-cache`,
    `${immutable}, no-store`,
    `${immutable}, private`,
    `${immutable}, max-age=0`,
    'public, max-age=31536000garbage, immutable'
  ])('rejects insufficient or conflicting browser cache policy: %s', (header) => {
    expect(policyErrors(header, true).length).toBeGreaterThan(0)
  })

  it('keeps HTML short lived independently of CDN TTL', () => {
    expect(policyErrors('public, max-age=0, s-maxage=31536000, must-revalidate', false)).toEqual([])
    expect(policyErrors('no-cache', false)).toEqual([])
    expect(policyErrors('no-store', false)).toEqual([])
    expect(policyErrors('max-age=300', false)).toEqual([])
    expect(policyErrors(immutable, false).length).toBeGreaterThan(0)
    expect(policyErrors('', false).length).toBeGreaterThan(0)
    expect(policyErrors('max-age=301', false).length).toBeGreaterThan(0)
  })

  it('discovers same-origin assets in HTML, CSS, and JS without including third parties', () => {
    expect(discoverAssets(`
      <script src="/_nuxt/entry.abc123ab.js"></script>
      <style>@font-face{src:url('/_nuxt/lora.def456ab.woff2')}</style>
      import './page.ghi789ab.css'; const image="./cover.jkl012ab.webp";
      const ignored="https://other.test/_nuxt/other.abc123ab.js";
      const publicImage="/favicon.png"; const librarySource="sqlite3-vfs-opfs.js";
      const sourceNames=["template.js", "manifest.js", "polyfill.js"];
      const payload="/_nuxt/_payload.json";
    `, 'https://site.test/_nuxt/entry.abc123ab.js')).toEqual([
      'https://site.test/_nuxt/cover.jkl012ab.webp',
      'https://site.test/_nuxt/entry.abc123ab.js',
      'https://site.test/_nuxt/lora.def456ab.woff2',
      'https://site.test/_nuxt/page.ghi789ab.css'
    ])
  })

  const fixtures = new Map([
    ['/', ['<script src="/_nuxt/entry.abc123ab.js"></script><a href="/blog/article">Read</a>', 'text/html']],
    ['/blog', ['<a href="/blog/article#section">Read</a><a href="/blog/article?from=index">Read</a><link href="/blog/_payload.json?build=current">', 'text/html']],
    ['/_nuxt/builds/latest.json', ['{"id":"current-build"}', 'application/json']],
    ['/blog/article', ['<img src="/_nuxt/cover.def456ab.png">', 'text/html']],
    ['/_nuxt/entry.abc123ab.js', ['import "./style.ghi789ab.css"', 'text/javascript']],
    ['/_nuxt/style.ghi789ab.css', ['src:url(./font.jkl012ab.woff2)', 'text/css']],
    ['/_nuxt/font.jkl012ab.woff2', ['', 'font/woff2']],
    ['/_nuxt/cover.def456ab.png', ['', 'image/png']]
  ])

  async function audit(override?: (path: string) => Response | undefined) {
    const requested: string[] = []
    const output: string[] = []
    const failures = await checkAssetCache('https://site.test', {
      log: (line: string) => output.push(line),
      fetcher: async (url: string | URL | Request, init?: RequestInit) => {
        expect(init?.redirect).toBe('manual')
        expect(init?.signal).toBeDefined()
        const path = new URL(String(url)).pathname
        requested.push(path)
        const replacement = override?.(path)
        if (replacement) return replacement
        const [body, type] = fixtures.get(path)!
        return new Response(body, { headers: {
          'content-type': type!,
          'cache-control': path.startsWith('/_nuxt/') && !path.endsWith('.json') ? immutable : 'no-cache'
        } })
      }
    })
    return { failures, requested, output }
  }

  it('crawls article images and transitive CSS/fonts once and succeeds with full coverage', async () => {
    const result = await audit()
    expect(result.failures).toBe(0)
    expect(result.requested.sort()).toEqual([...fixtures.keys()].sort())
  })

  it('fails on an HTML fallback masquerading as a successful asset', async () => {
    const result = await audit(path => path.endsWith('.png')
      ? new Response('<html>fallback</html>', { headers: { 'content-type': 'text/html', 'cache-control': immutable } })
      : undefined)
    expect(result.failures).toBe(1)
    expect(result.output.join('\n')).toContain('unexpected Content-Type: text/html')
  })

  it('fails on redirect/error statuses and missing asset coverage', async () => {
    const result = await audit(path => path.endsWith('.js')
      ? new Response('', { status: 302, headers: { location: '/login' } })
      : undefined)
    expect(result.failures).toBeGreaterThan(0)
    expect(result.output.join('\n')).toContain('expected 200, got 302')
    expect(result.output.join('\n')).toContain('no font assets discovered')
  })

  it.each(['/', '/_nuxt/builds/latest.json'])('rejects a long-lived mutable response at %s', async (path) => {
    const result = await audit(url => url === path
      ? new Response(fixtures.get(path)![0], { headers: {
          'content-type': path.endsWith('.json') ? 'application/json' : 'text/html',
          'cache-control': immutable
        } })
      : undefined)
    expect(result.failures).toBe(1)
    expect(result.output.join('\n')).toContain('must not be immutable')
  })

  it('allows a missing optional app manifest', async () => {
    const result = await audit(path => path.endsWith('latest.json') ? new Response('', { status: 404 }) : undefined)
    expect(result.failures).toBe(0)
    expect(result.output.join('\n')).toContain('app manifest not present')
  })

  it('reports network failures and fails when discovery is unavailable', async () => {
    const output: string[] = []
    const failures = await checkAssetCache('https://site.test', {
      log: (line: string) => output.push(line),
      fetcher: async () => { throw new Error('connection unavailable') }
    })
    expect(failures).toBeGreaterThan(0)
    expect(output.join('\n')).toContain('request failed: connection unavailable')
    expect(output.join('\n')).toContain('coverage is incomplete')
  })
})
