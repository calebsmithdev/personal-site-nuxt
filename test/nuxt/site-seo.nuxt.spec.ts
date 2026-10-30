import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { createHead } from '@unhead/vue/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSiteSeo } from '../../app/composables/useSiteSeo'
import { articleCardSocialImage, defaultSocialImage } from '../../app/utils/site'

const mocks = vi.hoisted(() => ({
  useHead: vi.fn(),
  useSeoMeta: vi.fn(),
  useSiteConfig: vi.fn()
}))

mockNuxtImport('useSiteConfig', () => mocks.useSiteConfig)
mockNuxtImport('useHead', () => mocks.useHead)
mockNuxtImport('useSeoMeta', () => mocks.useSeoMeta)

const defaultDescription = 'Caleb Smith is a full-stack developer in Kansas. Field notes on Vue, Nuxt, TypeScript and Laravel apps, and on Kubernetes and self-hosted infrastructure.'

const defaultImageUrl = 'https://caleb-smith.dev/social/default.png'
const defaultImageMeta = {
  ogImage: {
    url: defaultImageUrl,
    secureUrl: defaultImageUrl,
    type: 'image/png',
    width: 1200,
    height: 630,
    alt: defaultSocialImage.alt
  },
  twitterImage: { url: defaultImageUrl, alt: defaultSocialImage.alt }
}

const expectCanonical = (href: string) => {
  const head = mocks.useHead.mock.calls[0]?.[0]

  expect(head.link).toEqual([
    { rel: 'canonical', href }
  ])
  expect(head.link).toHaveLength(1)
  expect(JSON.stringify(head)).not.toContain('caleb-smith.dev//')

  return head
}

describe('useSiteSeo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.useSiteConfig.mockReturnValue({ url: 'https://caleb-smith.dev' })
  })

  it('uses the absolute homepage title at the root URL', () => {
    useSiteSeo({
      title: 'Caleb Smith | Full-Stack Developer in Kansas',
      description: defaultDescription,
      path: '/',
      absoluteTitle: true
    })

    expect(mocks.useSeoMeta).toHaveBeenCalledWith({
      description: defaultDescription,
      ogTitle: 'Caleb Smith | Full-Stack Developer in Kansas',
      ogDescription: defaultDescription,
      ogType: 'website',
      ogLocale: 'en_US',
      ogUrl: 'https://caleb-smith.dev/',
      twitterCard: 'summary_large_image',
      twitterCreator: '@CalebSmithDev',
      twitterSite: '@CalebSmithDev',
      twitterDomain: 'caleb-smith.dev',
      twitterTitle: 'Caleb Smith | Full-Stack Developer in Kansas',
      twitterDescription: defaultDescription,
      twitterUrl: 'https://caleb-smith.dev/',
      ...defaultImageMeta
    })

    const head = expectCanonical('https://caleb-smith.dev/')
    expect(head.title).toBe('Caleb Smith | Full-Stack Developer in Kansas')
    expect(head.titleTemplate).toBe('')
  })

  it('normalizes a blog path to one leading slash', () => {
    const description = 'Practical field notes.'

    useSiteSeo({
      title: 'Writing',
      description,
      path: '///blog'
    })

    expect(mocks.useSeoMeta).toHaveBeenCalledWith({
      description,
      ogTitle: 'Writing',
      ogDescription: description,
      ogType: 'website',
      ogLocale: 'en_US',
      ogUrl: 'https://caleb-smith.dev/blog',
      twitterCard: 'summary_large_image',
      twitterCreator: '@CalebSmithDev',
      twitterSite: '@CalebSmithDev',
      twitterDomain: 'caleb-smith.dev',
      twitterTitle: 'Writing',
      twitterDescription: description,
      twitterUrl: 'https://caleb-smith.dev/blog',
      ...defaultImageMeta
    })

    const head = expectCanonical('https://caleb-smith.dev/blog')
    expect(head.title).toBe('Writing')
    expect(head).not.toHaveProperty('titleTemplate')
  })

  it('uses article metadata with an absolute title', () => {
    const description = 'An article description.'

    useSiteSeo({
      title: 'Article title',
      description,
      path: 'blog/article-title',
      type: 'article',
      datePublished: '2024-01-01',
      dateModified: '2025-02-03',
      absoluteTitle: true
    })

    expect(mocks.useSeoMeta).toHaveBeenCalledWith({
      description,
      ogTitle: 'Article title',
      ogDescription: description,
      ogType: 'article',
      ogLocale: 'en_US',
      ogUrl: 'https://caleb-smith.dev/blog/article-title',
      twitterCard: 'summary_large_image',
      twitterCreator: '@CalebSmithDev',
      twitterSite: '@CalebSmithDev',
      twitterDomain: 'caleb-smith.dev',
      twitterTitle: 'Article title',
      twitterDescription: description,
      twitterUrl: 'https://caleb-smith.dev/blog/article-title',
      ...defaultImageMeta
    })

    const head = expectCanonical('https://caleb-smith.dev/blog/article-title')
    expect(head.title).toBe('Article title')
    expect(head.titleTemplate).toBe('')
  })

  it.each(['/', 'blog/example', '///blog/example'])(
    'uses the configured origin for %s, including a trailing origin slash',
    (path) => {
      mocks.useSiteConfig.mockReturnValue({ url: 'https://preview.example.test/' })

      useSiteSeo({ title: 'Example', description: 'Example description.', path })

      const url = `https://preview.example.test${path === '/' ? '/' : '/blog/example'}`
      expectCanonical(url)
      expect(mocks.useSeoMeta).toHaveBeenCalledWith(expect.objectContaining({
        ogUrl: url,
        twitterUrl: url,
        twitterDomain: 'preview.example.test',
        ogImage: expect.objectContaining({ url: 'https://preview.example.test/social/default.png' }),
        twitterImage: expect.objectContaining({ url: 'https://preview.example.test/social/default.png' })
      }))
    }
  )

  it('sends an article card with its known dimensions and type', () => {
    const image = articleCardSocialImage({ path: '/blog/nuxt/routing', title: 'Routing' })
    useSiteSeo({
      title: 'Routing',
      description: 'An article description.',
      path: '/blog/nuxt/routing',
      type: 'article',
      datePublished: '2024-01-01',
      dateModified: '2025-02-03',
      image
    })

    const imageUrl = 'https://caleb-smith.dev/social/blog/nuxt/routing.png'
    const meta = mocks.useSeoMeta.mock.calls[0]?.[0]
    expect(meta.ogImage).toEqual({
      url: imageUrl,
      secureUrl: imageUrl,
      type: 'image/png',
      width: 1200,
      height: 630,
      alt: image.alt
    })
    expect(meta.twitterImage).toEqual({ url: imageUrl, alt: image.alt })
  })

  it('resolves an override image path without claiming unknown dimensions', () => {
    useSiteSeo({
      title: 'Article title',
      description: 'An article description.',
      path: '/blog/article-title',
      type: 'article',
      datePublished: '2024-01-01',
      dateModified: '2025-02-03',
      image: { src: '/_nuxt/cover.abc123.png', alt: 'A diagram of the cluster' }
    })

    const imageUrl = 'https://caleb-smith.dev/_nuxt/cover.abc123.png'
    const meta = mocks.useSeoMeta.mock.calls[0]?.[0]
    expect(meta.ogImage).toEqual({
      url: imageUrl,
      secureUrl: imageUrl,
      alt: 'A diagram of the cluster'
    })
    expect(meta.twitterImage).toEqual({ url: imageUrl, alt: 'A diagram of the cluster' })
    expect(meta.twitterCard).toBe('summary_large_image')
  })

  it('keeps an absolute override image URL on its own host', () => {
    useSiteSeo({
      title: 'Article title',
      description: 'An article description.',
      path: '/blog/article-title',
      image: { src: 'https://images.example.test/cover.jpg', alt: 'Cover' }
    })

    const meta = mocks.useSeoMeta.mock.calls[0]?.[0]
    expect(meta.ogImage.url).toBe('https://images.example.test/cover.jpg')
    expect(meta.twitterImage.url).toBe('https://images.example.test/cover.jpg')
    expect(meta.ogImage).not.toHaveProperty('width')
    expect(meta.ogImage).not.toHaveProperty('height')
  })
})

const readStructuredData = () => {
  const scripts = mocks.useHead.mock.calls[0]?.[0].script
  expect(scripts).toHaveLength(1)
  expect(scripts[0].type).toBe('application/ld+json')
  return { source: scripts[0].innerHTML, data: JSON.parse(scripts[0].innerHTML) }
}

describe('structured metadata', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.useSiteConfig.mockReturnValue({ url: 'https://preview.example.test/' })
  })

  it('keeps distinct publication/modification dates and shares canonical and override image URLs', () => {
    useSiteSeo({
      title: 'Updated article', description: 'A summary.', path: '///blog/updated', type: 'article',
      datePublished: '2020-01-02', dateModified: '2026-10-24',
      image: { src: '/_nuxt/cover.png', alt: 'Cover' }
    })
    const { data } = readStructuredData()
    const seo = mocks.useSeoMeta.mock.calls[0]?.[0]
    expect(data['@graph']).toContainEqual(expect.objectContaining({
      '@type': 'Person', '@id': 'https://preview.example.test/#person',
      name: 'Caleb Smith',
      url: 'https://preview.example.test/',
      jobTitle: 'Full-Stack Developer',
      description: 'Full-stack developer in Kansas building web apps with Vue, Nuxt, TypeScript and Laravel, and the infrastructure that runs them.',
      homeLocation: {
        '@type': 'Place',
        name: 'Kansas, United States',
        address: { '@type': 'PostalAddress', addressRegion: 'KS', addressCountry: 'US' }
      },
      knowsAbout: ['Vue.js', 'Nuxt', 'TypeScript', 'Laravel', 'PHP', 'Kubernetes', 'Proxmox', 'Ceph', 'Self-hosting'],
      sameAs: [
        'https://github.com/calebsmithdev',
        'https://www.linkedin.com/in/calebsmithdev/',
        'https://x.com/CalebSmithDev',
        'https://bsky.app/profile/did:plc:m2blbfmeq3jyk4jiilzygri7'
      ]
    }))
    expect(data['@graph']).toContainEqual({
      '@type': 'BlogPosting', '@id': `${String(seo.ogUrl)}#blogposting`, url: seo.ogUrl,
      headline: seo.ogTitle, description: seo.ogDescription,
      datePublished: '2020-01-02', dateModified: '2026-10-24',
      mainEntityOfPage: { '@id': seo.ogUrl },
      author: { '@id': 'https://preview.example.test/#person' }, image: seo.ogImage.url
    })
  })

  it('renders script-closing text as safe, parseable JSON-LD', () => {
    const title = '</script><script>alert("title")</script>'
    const description = '<!-- & <tag> "quoted" \u2028 \u2029'
    useSiteSeo({
      title, description, path: '/blog/escaping', type: 'article',
      datePublished: '2020-01-02', dateModified: '2026-10-24'
    })
    const { source, data } = readStructuredData()
    expect(source).not.toContain('<')
    expect(data['@graph'][1].headline).toBe(title)
    expect(data['@graph'][1].description).toBe(description)
    const head = createHead()
    head.push(mocks.useHead.mock.calls[0]?.[0])
    const { headTags } = head.render()
    const scripts = [...headTags.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)]
    expect(scripts).toHaveLength(1)
    expect(headTags).not.toContain('<script>alert')
    const rendered = JSON.parse(scripts[0]![1]!)
    expect(rendered['@graph'][1].headline).toBe(title)
    expect(rendered['@graph'][1].description).toBe(description)
  })
})
