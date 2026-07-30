import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSiteSeo } from '../../app/composables/useSiteSeo'

const mocks = vi.hoisted(() => ({
  useHead: vi.fn(),
  useSeoMeta: vi.fn()
}))

mockNuxtImport('useHead', () => mocks.useHead)
mockNuxtImport('useSeoMeta', () => mocks.useSeoMeta)

const defaultDescription = 'A full stack web developer in Kansas with a speciality focus in React, Vue, PHP, WordPress and .NET Core.'

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
      twitterUrl: 'https://caleb-smith.dev/'
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
      twitterUrl: 'https://caleb-smith.dev/blog'
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
      twitterUrl: 'https://caleb-smith.dev/blog/article-title'
    })

    const head = expectCanonical('https://caleb-smith.dev/blog/article-title')
    expect(head.title).toBe('Article title')
    expect(head.titleTemplate).toBe('')
  })
})
