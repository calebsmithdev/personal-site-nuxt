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
}

const contentDirectory = fileURLToPath(new URL('../../content/blog', import.meta.url))
const articleFixtures: ArticleFixture[] = await Promise.all(
  (await readdir(contentDirectory))
    .filter(file => file.endsWith('.md'))
    .sort()
    .map(async (file) => {
      const source = await readFile(fileURLToPath(new URL(`../../content/blog/${file}`, import.meta.url)), 'utf8')
      const title = source.match(/^title:\s*(['"])(.*?)\1$/m)?.[2]

      if (!title) {
        throw new Error(`Expected ${file} to have a quoted title`)
      }

      return {
        slug: basename(file, '.md'),
        title
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
  it('discovers the complete twelve-article collection', () => {
    expect(articleFixtures).toHaveLength(12)
  })

  it.each(articleFixtures)('renders $slug from the typed blog collection', async ({ slug, title }) => {
    const response = await fetch(`/blog/${slug}`)
    const html = await response.text()

    expect(response.status).toBe(200)
    expect(html).toContain(title)
    expect(html).toMatch(/<article\b[^>]*\bid="full-content"/)
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
