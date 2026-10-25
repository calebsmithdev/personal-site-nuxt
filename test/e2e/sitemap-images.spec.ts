import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { fetch as fetchNuxt, setup } from '@nuxt/test-utils/e2e'
import { describe, expect, it } from 'vitest'

// Reuse the same assertions against a server serving npm run generate output.
const externalOrigin = process.env.SITEMAP_TEST_ORIGIN
if (!externalOrigin) {
  await setup({ rootDir: fileURLToPath(new URL('../..', import.meta.url)) })
}

const fetchSite = (path: string) => externalOrigin
  ? globalThis.fetch(new URL(path, externalOrigin))
  : fetchNuxt(path)
const siteOrigin = 'https://caleb-smith.dev'
const articles = [
  ['hiding-field-labels-with-advanced-custom-fields-acf', 2],
  ['how-to-prevent-chatgpt-from-crawling-your-website-using-wordpress', 1]
] as const

describe('sitemap images', () => {
  it('lists each rendered article image once, keeps lastmod, and serves every image', async () => {
    const response = await fetchSite('/sitemap.xml')
    expect(response.status).toBe(200)
    const xml = await response.text()
    const entries = xml.match(/<url>[\s\S]*?<\/url>/g) ?? []
    const allImages = [...xml.matchAll(/<image:loc>(.*?)<\/image:loc>/g)].map(match => match[1]!)

    expect(allImages).toHaveLength(3)
    expect(new Set(allImages).size).toBe(allImages.length)
    expect(xml).not.toContain(`${siteOrigin}/assets/`)

    for (const [slug, count] of articles) {
      const path = `/blog/${slug}`
      const entry = entries.find(entry => entry.includes(`<loc>${siteOrigin}${path}</loc>`))
      expect(entry).toBeDefined()
      const source = await readFile(fileURLToPath(new URL(`../../content/blog/${slug}.md`, import.meta.url)), 'utf8')
      const lastmod = source.match(/^sitemap:\s*\n\s+lastmod:\s*(\d{4}-\d{2}-\d{2})/m)?.[1]
      expect(lastmod).toBeDefined()
      expect(entry).toContain(`<lastmod>${lastmod}</lastmod>`)

      const articleResponse = await fetchSite(path)
      expect(articleResponse.status).toBe(200)
      const html = await articleResponse.text()
      const body = html.match(/<article\b[^>]*id="full-content"[\s\S]*?<\/article>/)?.[0] ?? ''
      const renderedImages = [...body.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)]
        .map(match => new URL(match[1]!, siteOrigin).href)
      const sitemapImages = [...entry!.matchAll(/<image:loc>(.*?)<\/image:loc>/g)].map(match => match[1])
      expect(renderedImages).toHaveLength(count)
      expect(sitemapImages.sort()).toEqual(renderedImages.sort())
    }

    for (const image of allImages) {
      const url = new URL(image)
      expect(url.origin).toBe(siteOrigin)
      expect(url.pathname).toMatch(/^\/_nuxt\/.+\.png$/)
      const imageResponse = await fetchSite(url.pathname)
      expect(imageResponse.status, image).toBe(200)
      expect(imageResponse.headers.get('content-type')).toContain('image/png')
    }
  })
})
