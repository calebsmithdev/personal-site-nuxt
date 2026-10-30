import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { test } from 'node:test'

const siteOrigin = 'https://caleb-smith.dev'
const output = new URL('../../.output/public/', import.meta.url)
const content = new URL('../../content/blog/', import.meta.url)
const files = (await readdir(content, { recursive: true })).filter(file => file.endsWith('.md'))
const xml = await readFile(new URL('rss.xml', output), 'utf8')

// The feed's shape is fixed by server/routes/rss.xml.ts, and article HTML inside
// CDATA is entity-escaped text, so a literal </item> cannot appear in a body.
// Regex extraction avoids an XML parser dependency and DOM resource loading.
const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(([, item]) => item)
const field = (item, name) => item.match(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)</${name}>`))?.[1]
const getAttribute = (tag, attribute) => tag.match(new RegExp(`\\b${attribute}=(["'])(.*?)\\1`, 'i'))?.[2]

test('RSS contains every source article with canonical URLs, dates, categories and full HTML', async () => {
  assert.match(xml, /<rss version="2.0"/)
  assert.match(xml, /xmlns:content="http:\/\/purl.org\/rss\/1.0\/modules\/content\/"/)
  assert.match(xml, /xmlns:atom="http:\/\/www.w3.org\/2005\/Atom"/)
  assert.equal(items.length, files.length)
  for (const file of files) {
    const url = `${siteOrigin}/blog/${file.slice(0, -3)}`
    const item = items.find(item => field(item, 'link') === url)
    assert.ok(item, url)
    assert.equal(field(item, 'guid'), url)
    assert.match(item, /<guid isPermaLink="true">/)
    const date = field(item, 'pubDate')
    assert.ok(Number.isFinite(Date.parse(date)), date)
    const source = await readFile(new URL(file, content), 'utf8')
    assert.equal(Date.parse(date), Date.parse(`${source.match(/^date:\s*(\d{4}-\d{2}-\d{2})/m)?.[1]}T00:00:00Z`))
    assert.match(item, /<category>[^<]+<\/category>/)
  }
  const bodies = items.map(item => field(item, 'content:encoded'))
  assert.equal(bodies.filter(Boolean).length, files.length)
  for (const body of bodies) {
    assert.match(body, /^<!\[CDATA\[[\s\S]*\]\]>$/)
    assert.doesNotMatch(body, /\b(?:src|href)=["']\//)
    assert.doesNotMatch(body, /<(?:script|style)\b/)
    assert.match(body, /<(?:p|pre|h[1-6])\b/)
    for (const [, src] of body.matchAll(/src="https:\/\/caleb-smith.dev([^"]+)"/g)) {
      await readFile(new URL(decodeURIComponent(src).slice(1), output))
    }
  }
  const dates = items.map(item => Date.parse(field(item, 'pubDate')))
  assert.deepEqual(dates, [...dates].sort((a, b) => b - a))
  assert.equal(Date.parse(field(xml, 'lastBuildDate')), dates[0])
  assert.ok(!(await readFile(new URL('sitemap.xml', output), 'utf8')).includes('/rss.xml'))
})

test('homepage advertises RSS with an alternate link and footer link', async () => {
  const html = await readFile(new URL('index.html', output), 'utf8')
  const alternate = (html.match(/<link\b[^>]*>/gi) ?? [])
    .find(tag => getAttribute(tag, 'rel') === 'alternate' && getAttribute(tag, 'type') === 'application/rss+xml')
  assert.ok(alternate)
  assert.equal(getAttribute(alternate, 'title'), 'Caleb Smith')
  assert.equal(getAttribute(alternate, 'href'), `${siteOrigin}/rss.xml`)
  const footer = html.match(/<footer\b[^>]*>[\s\S]*?<\/footer>/i)?.[0] ?? ''
  assert.match(footer, /<a\b[^>]*href="\/rss\.xml"[^>]*>\s*RSS\s*<\/a>/)
})
