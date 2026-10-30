import { readdir, readFile } from 'node:fs/promises'
import { basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fetch, setup } from '@nuxt/test-utils/e2e'
import { describe, expect, it } from 'vitest'

await setup({
  rootDir: fileURLToPath(new URL('../..', import.meta.url))
})

interface ArticleFixture {
  slug: string
  title: string
  date: string
  lastmod: string
}

const contentDirectory = fileURLToPath(new URL('../../content/blog', import.meta.url))
const articleFixtures: ArticleFixture[] = await Promise.all(
  (await readdir(contentDirectory))
    .filter(file => file.endsWith('.md'))
    .sort()
    .map(async (file) => {
      const source = await readFile(fileURLToPath(new URL(`../../content/blog/${file}`, import.meta.url)), 'utf8')
      const title = source.match(/^title:\s*(['"])(.*?)\1$/m)?.[2]
      const lastmod = source.match(/^sitemap:\s*\n\s+lastmod:\s*(\d{4}-\d{2}-\d{2})\s*$/m)?.[1]
      const date = source.match(/^date:\s*(\d{4}-\d{2}-\d{2})\s*$/m)?.[1]

      if (!title) {
        throw new Error(`Expected ${file} to have a quoted title`)
      }

      if (!lastmod || !date) {
        throw new Error(`Expected ${file} to have publication and sitemap.lastmod dates`)
      }

      return {
        slug: basename(file, '.md'),
        title,
        date,
        lastmod
      }
    })
)

const articlePath = '/blog/migrating-kubernetes-pvcs-from-csi-proxmox-to-csi-cephfs'
const localImageArticlePath = '/blog/how-to-prevent-chatgpt-from-crawling-your-website-using-wordpress'
const siteOrigin = 'https://caleb-smith.dev'

const getAttribute = (tag: string, attribute: string) => {
  return tag.match(new RegExp(`\\b${attribute}=(["'])(.*?)\\1`, 'i'))?.[2]
}

describe('Content 3 route migration', () => {
  it('keeps sitemap article URLs and their frontmatter modification dates', async () => {
    const response = await fetch('/sitemap.xml')
    const xml = await response.text()
    const entries = (xml.match(/<url>[\s\S]*?<\/url>/g) ?? []).map(entry => ({
      loc: entry.match(/<loc>(.*?)<\/loc>/)?.[1],
      lastmod: entry.match(/<lastmod>(.*?)<\/lastmod>/)?.[1]
    }))

    expect(response.status).toBe(200)
    expect(entries).toHaveLength(articleFixtures.length + 2)
    expect(entries).toContainEqual({ loc: `${siteOrigin}/`, lastmod: undefined })
    expect(entries).toContainEqual({ loc: `${siteOrigin}/blog`, lastmod: undefined })

    for (const { slug, lastmod } of articleFixtures) {
      expect(entries).toContainEqual({ loc: `${siteOrigin}/blog/${slug}`, lastmod })
    }
    for (const { loc } of entries) {
      expect(loc).toBeDefined()
      expect(loc?.slice(siteOrigin.length)).not.toContain('//')
    }
  })

  it('advertises the canonical sitemap and blocks only AI training crawlers', async () => {
    const response = await fetch('/robots.txt')
    const robots = await response.text()
    const groups = robots.split(/\n\s*\n/)
    const rulesFor = (token: string) => groups
      .filter(group => group.split('\n').some(line => line.toLowerCase() === `user-agent: ${token.toLowerCase()}`))
      .join('\n')

    expect(response.status).toBe(200)
    expect(robots).toContain(`Sitemap: ${siteOrigin}/sitemap.xml`)
    expect(rulesFor('*')).toContain('User-agent: *')
    expect(rulesFor('*')).not.toMatch(/^Disallow:[ \t]*\/[ \t]*$/m)
    for (const token of ['GPTBot', 'ClaudeBot', 'CCBot', 'Google-Extended', 'Applebot-Extended']) {
      expect(rulesFor(token), token).toMatch(/^Disallow: \/$/m)
    }
  })

  it('serves the RSS feed with its content type and every article', async () => {
    const response = await fetch('/rss.xml')
    const xml = await response.text()

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('application/rss+xml; charset=utf-8')
    expect(xml.match(/<item>/g)).toHaveLength(articleFixtures.length)
  })

  it('discovers the complete twelve-article collection', () => {
    expect(articleFixtures).toHaveLength(12)
  })

  it.each(articleFixtures)('renders $slug from the typed blog collection', async ({ slug, title, date, lastmod }) => {
    const response = await fetch(`/blog/${slug}`)
    const html = await response.text()

    expect(response.status).toBe(200)
    expect(html).toContain(title)
    expect(html).toMatch(/<article\b[^>]*\bid="full-content"/)

    const scripts = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)]
    expect(scripts).toHaveLength(1)
    const data = JSON.parse(scripts[0]![1]!)
    expect(data['@context']).toBe('https://schema.org')
    expect(data['@graph']).toContainEqual(expect.objectContaining({
      '@type': 'BlogPosting',
      headline: title,
      datePublished: date,
      dateModified: lastmod,
      mainEntityOfPage: { '@id': `${siteOrigin}/blog/${slug}` },
      author: { '@id': `${siteOrigin}/#person` }
    }))
    expect(data['@graph']).toContainEqual(expect.objectContaining({
      '@type': 'Person', '@id': `${siteOrigin}/#person`, name: 'Caleb Smith'
    }))
    const posting = data['@graph'].find((node: { '@type': string }) => node['@type'] === 'BlogPosting')
    const imageMeta = (html.match(/<meta\b[^>]*>/g) ?? []).find(tag => getAttribute(tag, 'property') === 'og:image')
    expect(posting.image).toBe(getAttribute(imageMeta!, 'content'))
  })

  it.each([
    ['/', 'Full Stack Web Developer | Caleb Smith'],
    ['/blog', 'Writing | Caleb Smith']
  ])('keeps the public index route %s', async (path, title) => {
    const response = await fetch(path)
    const html = await response.text()

    expect(response.status).toBe(200)
    expect(html).toContain(`<title>${title}</title>`)
  })

  it('keeps the guaranteed-missing article at 404', async () => {
    const response = await fetch('/blog/__missing-content3-migration-article__')

    expect(response.status).toBe(404)
  })

  it('preserves the Kubernetes nested H3 table of contents', async () => {
    const response = await fetch(articlePath)
    const html = await response.text()

    expect(response.status).toBe(200)
    for (const id of [
      'step-1-create-a-new-pvc-for-cephfs',
      'step-2-launch-a-migration-pod',
      'step-3-point-tautulli-to-the-new-pvc',
      'step-4-cleanup'
    ]) {
      expect(html).toContain(`href="#${id}"`)
      expect(html).toContain(`id="${id}"`)
    }
    expect(html).toContain('toc-link-depth-3')
  })

  it('serves an article-local image from the built asset graph', async () => {
    const articleResponse = await fetch(localImageArticlePath)
    const html = await articleResponse.text()
    const imageTag = (html.match(/<img\b[^>]*>/gi) ?? [])
      .find(tag => getAttribute(tag, 'alt') === 'Visual reference in the AIOSEO Plugin')
    const imagePath = imageTag ? getAttribute(imageTag, 'src') : undefined

    expect(articleResponse.status).toBe(200)
    expect(imagePath).toMatch(/^\/_nuxt\/.+\.png$/)

    const imageResponse = await fetch(imagePath!)
    expect(imageResponse.status).toBe(200)
    expect(imageResponse.headers.get('content-type')).toContain('image/png')
  })

  it.each([
    '/blog/hiding-field-labels-with-advanced-custom-fields-acf',
    localImageArticlePath
  ])('reserves the intrinsic image aspect ratios on %s', async (path) => {
    const response = await fetch(path)
    const html = await response.text()
    const articleBody = html.match(/<article id="full-content"[\s\S]*?<\/article>/)?.[0] ?? ''
    const images = articleBody.match(/<img\b[^>]*>/gi) ?? []

    expect(response.status).toBe(200)
    expect(images).toHaveLength(path === localImageArticlePath ? 1 : 2)

    for (const image of images) {
      const src = getAttribute(image, 'src')
      expect(src).toMatch(/^\/_nuxt\/.+\.png$/)
      const imageResponse = await fetch(src!)
      const bytes = Buffer.from(await imageResponse.arrayBuffer())

      expect(imageResponse.status).toBe(200)
      // The PNG IHDR stores the intrinsic width and height at bytes 16 and 20.
      expect(getAttribute(image, 'width')).toBe(String(bytes.readUInt32BE(16)))
      expect(getAttribute(image, 'height')).toBe(String(bytes.readUInt32BE(20)))
      expect(getAttribute(image, 'loading')).toBe('lazy')
      expect(getAttribute(image, 'decoding')).toBe('async')
      expect(getAttribute(image, 'alt')).toBeTruthy()
    }
  })

  it('retains canonical and Open Graph metadata on a migrated article', async () => {
    const response = await fetch(articlePath)
    const html = await response.text()
    const canonical = `${siteOrigin}${articlePath}`

    expect(response.status).toBe(200)
    expect(html).toContain(`<link rel="canonical" href="${canonical}">`)
    expect(html).toContain(`<meta property="og:url" content="${canonical}">`)
    expect(html).toContain('<meta property="og:type" content="article">')
  })
})
