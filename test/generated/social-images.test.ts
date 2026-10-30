import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { test } from 'node:test'

import { socialImageOutputPath } from './social-image-path.ts'

const siteOrigin = 'https://caleb-smith.dev'
const contentDirectory = new URL('../../content/blog/', import.meta.url)
const outputDirectory = new URL('../../.output/public/', import.meta.url)
const regenerate = 'Run `npm run social-image` to render the article cards, then commit public/social/blog/.'

const getAttribute = (tag: string, attribute: string) => tag.match(new RegExp(`\\b${attribute}=(["'])(.*?)\\1`, 'i'))?.[2]?.replaceAll('&amp;', '&')
const getMeta = (head: string, attribute: 'name' | 'property', key: string) => {
  const tags = (head.match(/<meta\b[^>]*>/gi) ?? []).filter(tag => getAttribute(tag, attribute) === key)
  assert.ok(tags.length <= 1, `Expected at most one ${key} tag`)
  return tags[0] && getAttribute(tags[0], 'content')
}

const readPngSize = (file: Buffer) => {
  if (file.length < 24 || file.toString('latin1', 1, 4) !== 'PNG' || file.toString('latin1', 12, 16) !== 'IHDR') {
    return undefined
  }
  return { width: file.readUInt32BE(16), height: file.readUInt32BE(20) }
}

// Follow the README's file-to-URL convention, including nested files.
const articlePaths = (await readdir(contentDirectory, { recursive: true }))
  .filter(file => file.endsWith('.md'))
  .sort()
  .map(file => `/blog/${file.slice(0, -3)}`)

await test('finds source articles', () => {
  assert.ok(articlePaths.length > 0)
})

for (const path of articlePaths) {
  await test(`${path} sends a social image that ships with the site`, async () => {
    const html = await readFile(new URL(`${path.slice(1)}/index.html`, outputDirectory), 'utf8')
    const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? ''
    const image = getMeta(head, 'property', 'og:image')
    assert.ok(image, `${path} must have an og:image`)
    assert.equal(getMeta(head, 'name', 'twitter:image'), image, `${path} twitter:image must match og:image`)

    const structuredData = head.match(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i)?.[1]
    assert.ok(structuredData, `${path} must have structured data`)
    const posting = (JSON.parse(structuredData) as { '@graph': Array<{ '@type': string, image?: string }> })['@graph']
      .find(node => node['@type'] === 'BlogPosting')
    assert.equal(posting?.image, image, `${path} BlogPosting image must match og:image`)

    const url = new URL(image)
    // An absolute https override on another host can't be checked against the build.
    if (url.origin !== siteOrigin) { return }

    const file = await readFile(socialImageOutputPath(image, outputDirectory)).catch(() => undefined)
    assert.ok(file, `${path} sends og:image ${image}, but .output/public${url.pathname} doesn't exist. ${regenerate}`)

    const width = getMeta(head, 'property', 'og:image:width')
    const height = getMeta(head, 'property', 'og:image:height')
    assert.equal(Boolean(width), Boolean(height), `${path} must declare both image dimensions or neither`)
    if (width && height) {
      assert.equal(getMeta(head, 'property', 'og:image:type'), 'image/png', `${path} declares dimensions only for PNG cards`)
      assert.deepEqual(
        readPngSize(file),
        { width: Number(width), height: Number(height) },
        `${path} declares a ${width}x${height} og:image, but ${url.pathname} doesn't match. ${regenerate}`
      )
    }
  })
}
