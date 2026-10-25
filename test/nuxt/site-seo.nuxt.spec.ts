import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSiteSeo } from '../../app/composables/useSiteSeo'
import { defaultSocialImage } from '../../app/utils/site'

const mocks = vi.hoisted(() => ({
  useHead: vi.fn(),
  useSeoMeta: vi.fn(),
  useSiteConfig: vi.fn()
}))

mockNuxtImport('useSiteConfig', () => mocks.useSiteConfig)
mockNuxtImport('useHead', () => mocks.useHead)
mockNuxtImport('useSeoMeta', () => mocks.useSeoMeta)

const defaultDescription = 'A full stack web developer in Kansas with a speciality focus in React, Vue, PHP, WordPress and .NET Core.'

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

  it('uses the root URL with the default title template behavior', () => {
    useSiteSeo({
      title: 'Full Stack Web Developer',
      description: defaultDescription,
      path: '/'
    })

    expect(mocks.useSeoMeta).toHaveBeenCalledWith({
      description: defaultDescription,
      ogTitle: 'Full Stack Web Developer',
      ogDescription: defaultDescription,
      ogType: 'website',
      ogLocale: 'en_US',
      ogUrl: 'https://caleb-smith.dev/',
      twitterCard: 'summary_large_image',
      twitterCreator: '@CalebSmithDev',
      twitterSite: '@CalebSmithDev',
      twitterDomain: 'caleb-smith.dev',
      twitterTitle: 'Full Stack Web Developer',
      twitterDescription: defaultDescription,
      twitterUrl: 'https://caleb-smith.dev/',
      ...defaultImageMeta
    })

    const head = expectCanonical('https://caleb-smith.dev/')
    expect(head.title).toBe('Full Stack Web Developer')
    expect(head).not.toHaveProperty('titleTemplate')
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

  it('resolves an override image path without claiming unknown dimensions', () => {
    useSiteSeo({
      title: 'Article title',
      description: 'An article description.',
      path: '/blog/article-title',
      type: 'article',
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
