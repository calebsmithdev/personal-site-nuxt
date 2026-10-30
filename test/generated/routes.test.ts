import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { after, test } from 'node:test'
import { Window } from 'happy-dom'

const window = new Window()
const parser = new window.DOMParser()
after(() => window.happyDOM.close())

const siteOrigin = 'https://caleb-smith.dev'
const contentDirectory = new URL('../../content/blog/', import.meta.url)
const outputDirectory = new URL('../../.output/public/', import.meta.url)
const readOutput = (path: string) => readFile(new URL(path, outputDirectory), 'utf8')
const getAttribute = (tag: string | undefined, attribute: string) => tag?.match(new RegExp(`\\b${attribute}=(["'])(.*?)\\1`, 'i'))?.[2]
const escapeText = (text: string) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')

// Derive the expected routes from source files, independently of crawler discovery
// and sitemap generation, so an undiscovered article cannot silently disappear.
// Follow the README's file-to-URL convention, including nested files. Unsupported
// file naming or routing must fail here rather than leave an article unpublished.
const articles = await Promise.all(
  (await readdir(contentDirectory, { recursive: true }))
    .filter(file => file.endsWith('.md'))
    .sort()
    .map(async (file) => {
      const source = await readFile(new URL(file, contentDirectory), 'utf8')
      const title = source.match(/^title:\s*(['"])(.*?)\1$/m)?.[2]
      const lastmod = source.match(/^sitemap:\s*\n\s+lastmod:\s*(\d{4}-\d{2}-\d{2})\s*$/m)?.[1]

      assert.ok(title, `Expected ${file} to have a quoted title`)
      assert.ok(lastmod, `Expected ${file} to have a sitemap.lastmod date`)

      return { path: `/blog/${file.slice(0, -3)}`, title, lastmod }
    })
)

const routes: Array<{ path: string, title: string, lastmod?: string }> = [
  { path: '/', title: 'Full Stack Web Developer | Caleb Smith' },
  { path: '/blog', title: 'Writing | Caleb Smith' },
  ...articles
]

for (const route of routes) {
  await test(`prerenders ${route.path} with its own content, metadata, and payload`, async () => {
    const directory = route.path === '/' ? '' : `${route.path.slice(1)}/`
    // Read the exact artifact: no server, route rewrite, or SPA fallback.
    const html = await readOutput(`${directory}index.html`)
    const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1]
    assert.ok(head, `${route.path} must have a document head`)
    assert.ok(head.includes(`<title>${escapeText(route.title)}</title>`), `${route.path} title`)
    const canonicalTags = (head.match(/<link\b[^>]*>/gi) ?? [])
      .filter(tag => getAttribute(tag, 'rel') === 'canonical')
    assert.equal(canonicalTags.length, 1)
    assert.equal(getAttribute(canonicalTags[0], 'href'), `${siteOrigin}${route.path}`)
    assert.ok(head.includes(`<meta property="og:type" content="${route.lastmod ? 'article' : 'website'}">`))

    if (route.lastmod) {
      const body = html.match(/<article\b[^>]*\bid="full-content"[^>]*>([\s\S]*?)<\/article>/)?.[1]
      assert.ok(body, `${route.path} must have an article body`)
      assert.match(body, /<(?:p|h[1-6]|pre|ul|ol|blockquote|table)\b/, `${route.path} must have rendered Markdown`)
      const document = parser.parseFromString(body, 'text/html')
      assert.ok(document.body.textContent.trim(), `${route.path} must have article text`)
    }

    const payload = await readOutput(`${directory}_payload.json`)
    // Normalize JSON escapes (including Nuxt's escaped slashes) before checking
    // values in the serialized data, without depending on devalue's references.
    const payloadData = JSON.stringify(JSON.parse(payload))
    if (route.lastmod) {
      assert.ok(payloadData.includes(JSON.stringify(route.title)), `${route.path} payload must contain its article title`)
    }
    else {
      // useBlog stores its list in useState, which Nuxt serializes inline rather
      // than in the extracted useAsyncData payload used by individual articles.
      const state = html.match(/<script\b[^>]*\bid="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)?.[1]
      assert.ok(state, `${route.path} must have inline page state`)
      const stateData = JSON.stringify(JSON.parse(state))
      for (const { path } of articles) {
        assert.ok(stateData.includes(JSON.stringify(path)), `${route.path} state must contain ${path}`)
      }
    }
  })
}

await test('prerendered blog index links to every source article', async () => {
  assert.ok(articles.length > 0)
  const html = await readOutput('blog/index.html')
  for (const { path } of articles) {
    assert.ok(html.includes(`href="${path}"`), `Blog index must link to ${path}`)
  }
})

await test('generated sitemap preserves all public routes and article modification dates', async () => {
  const xml = await readOutput('sitemap.xml')
  const entries = (xml.match(/<url>[\s\S]*?<\/url>/g) ?? []).map(entry => ({
    loc: entry.match(/<loc>(.*?)<\/loc>/)?.[1],
    lastmod: entry.match(/<lastmod>(.*?)<\/lastmod>/)?.[1]
  }))

  assert.equal(entries.length, routes.length)
  for (const { path, lastmod } of routes) {
    assert.deepEqual(entries.find(entry => entry.loc === `${siteOrigin}${path}`), {
      loc: `${siteOrigin}${path}`,
      lastmod
    })
  }
})

await test('generated robots.txt advertises the canonical sitemap and allows crawling', async () => {
  const robots = await readOutput('robots.txt')
  assert.match(robots, /^User-agent: \*\s*$/m)
  assert.ok(robots.includes(`Sitemap: ${siteOrigin}/sitemap.xml`))
  const groups = robots.split(/\n\s*\n/)
  const rulesFor = (token: string) => groups.filter(group => group.split('\n').some(line => line.toLowerCase() === `user-agent: ${token.toLowerCase()}`)).join('\n')
  assert.match(rulesFor('*'), /^(?:Allow: \/|Disallow:[ \t]*)$/m)
  assert.doesNotMatch(rulesFor('*'), /^Disallow:[ \t]*\/[ \t]*$/m)
  for (const token of ['GPTBot', 'ClaudeBot', 'CCBot', 'Google-Extended', 'Applebot-Extended']) {
    assert.match(rulesFor(token), /^Disallow: \/$/m, token)
  }
  for (const token of ['Googlebot', 'Bingbot', 'Applebot', 'OAI-SearchBot', 'ChatGPT-User', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User']) {
    assert.doesNotMatch(rulesFor(token), /^Disallow:[ \t]*\/[ \t]*$/m, token)
  }
})
