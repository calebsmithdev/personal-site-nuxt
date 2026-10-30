import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { fetch, setup } from '@nuxt/test-utils/e2e'
import { describe, expect, it } from 'vitest'
import { defaultSocialImage } from '../../app/utils/site'
import { securityHeaders } from '../../config/security-headers'

await setup({
  rootDir: fileURLToPath(new URL('../..', import.meta.url)),
  env: { NUXT_PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN: '' }
})

const siteOrigin = 'https://caleb-smith.dev'
const articlePath = '/blog/migrating-kubernetes-pvcs-from-csi-proxmox-to-csi-cephfs'
const articleTitle = 'Migrating Kubernetes PVCs from csi-proxmox to csi-cephfs'
const defaultDescription = 'A full stack web developer in Kansas with a speciality focus in React, Vue, PHP, WordPress and .NET Core.'
const blogDescription = 'Practical field notes from Caleb Smith on web development, infrastructure, Kubernetes, WordPress, and SwiftUI.'
const articleDescription = 'My journey moving from Proxmox VMs to CephFS as my k8s primary data storage.'

const defaultImageUrl = `${siteOrigin}/social/default.png`

interface RouteMetadata {
  path: string
  documentTitle: string
  socialTitle: string
  description: string
  type: 'website' | 'article'
}

const routeMetadata: RouteMetadata[] = [
  {
    path: '/',
    documentTitle: 'Full Stack Web Developer | Caleb Smith',
    socialTitle: 'Full Stack Web Developer',
    description: defaultDescription,
    type: 'website'
  },
  {
    path: '/blog',
    documentTitle: 'Writing | Caleb Smith',
    socialTitle: 'Writing',
    description: blogDescription,
    type: 'website'
  },
  {
    path: articlePath,
    documentTitle: articleTitle,
    socialTitle: articleTitle,
    description: articleDescription,
    type: 'article'
  }
]

const getHead = (html: string) => {
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1]
  expect(head).toBeDefined()
  return head ?? ''
}

const getTags = (head: string, tagName: 'link' | 'meta' | 'script') => {
  return head.match(new RegExp(`<${tagName}\\b[^>]*>`, 'gi')) ?? []
}

const getAttribute = (tag: string, attribute: string) => {
  return tag.match(new RegExp(`\\b${attribute}=(["'])(.*?)\\1`, 'i'))?.[2]
}

const expectUniqueMeta = (
  head: string,
  attribute: 'name' | 'property',
  key: string,
  content: string
) => {
  const matches = getTags(head, 'meta')
    .filter(tag => getAttribute(tag, attribute) === key)

  expect(matches).toHaveLength(1)
  assert.ok(matches[0])
  expect(getAttribute(matches[0], 'content')).toBe(content)

  return matches[0]
}

describe('article routes', () => {
  it.each([
    '/',
    '/blog',
    '/blog/how-to-connect-to-your-steam-deck-using-ftp',
    '/blog/__missing-security-header-article__',
    '/robots.txt'
  ])('serves report-only CSP and Permissions-Policy on %s', async (path) => {
    const response = await fetch(path)

    expect(response.status).toBe(path.includes('__missing-') ? 404 : 200)
    for (const [name, value] of Object.entries(securityHeaders)) {
      expect(response.headers.get(name)).toBe(value)
    }
    // Nitro already hardens its error documents with an enforcing CSP.
    expect(response.headers.get('Content-Security-Policy')).toBe(
      response.status === 404 ? "script-src 'none'; frame-ancestors 'none';" : null
    )
  })

  it('renders the Steam Deck article video', async () => {
    const response = await fetch('/blog/how-to-connect-to-your-steam-deck-using-ftp')
    expect(await response.text()).toContain('https://www.youtube.com/embed/')
  })

  it('keeps analytics code out of unconfigured page scripts and resource hints', async () => {
    const response = await fetch('/')
    const html = await response.text()
    expect(html).not.toContain('static.cloudflareinsights.com/beacon.min.js')
    const head = getHead(html)
    const scriptHints = getTags(head, 'link').filter((tag) => {
      const rel = getAttribute(tag, 'rel')
      return rel === 'modulepreload'
        || (getAttribute(tag, 'as') === 'script' && (rel === 'preload' || rel === 'prefetch'))
    })
    const scriptPaths = [...new Set([
      ...getTags(head, 'script').map(tag => getAttribute(tag, 'src')),
      ...scriptHints.map(tag => getAttribute(tag, 'href'))
    ].filter((path): path is string => Boolean(path)))]

    expect(scriptPaths.length).toBeGreaterThan(0)
    await Promise.all(scriptPaths.map(async (path) => {
      expect(path).toMatch(/^\/_nuxt\//)
      const scriptResponse = await fetch(path)
      expect(scriptResponse.status).toBe(200)
      expect(await scriptResponse.text()).not.toContain('cloudflareinsights.com')
    }))
  })

  it('renders a known article document', async () => {
    const response = await fetch(articlePath)
    const html = await response.text()

    expect(response.status).toBe(200)
    expect(html).toContain(articleTitle)
    expect(html).toMatch(/<article\b[^>]*\bid="full-content"/)
  })

  it('returns not found for a guaranteed-missing article', async () => {
    const response = await fetch('/blog/__missing-characterization-article__')

    expect(response.status).toBe(404)
  })
})

describe('route metadata', () => {
  it('renders the home Person and WebSite with the existing identity links', async () => {
    const html = await (await fetch('/')).text()
    const head = getHead(html)
    const scripts = [...head.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)]
    expect(scripts).toHaveLength(1)
    const data = JSON.parse(scripts[0]![1]!)
    const footer = html.match(/<footer\b[^>]*>[\s\S]*?<\/footer>/i)?.[0] ?? ''
    const identityLinks = (footer.match(/<a\b[^>]*>/gi) ?? [])
      .map(tag => getAttribute(tag, 'href'))
      .filter(href => href?.startsWith('https://'))
    expect(data['@graph'][0].sameAs).toEqual(identityLinks)
    expect(data).toEqual({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Person', '@id': `${siteOrigin}/#person`, name: 'Caleb Smith', url: `${siteOrigin}/`,
          sameAs: ['https://github.com/calebsmithdev', 'https://www.linkedin.com/in/calebsmithdev/']
        },
        {
          '@type': 'WebSite', '@id': `${siteOrigin}/#website`, url: `${siteOrigin}/`, name: 'Caleb Smith',
          description: defaultDescription, author: { '@id': `${siteOrigin}/#person` }
        }
      ]
    })
  })

  it('does not label the blog index or missing article as a BlogPosting', async () => {
    for (const path of ['/blog', '/blog/__missing-structured-data__']) {
      const response = await fetch(path)
      expect(response.status).toBe(path === '/blog' ? 200 : 404)
      expect(await response.text()).not.toContain('application/ld+json')
    }
  })

  it.each(routeMetadata)('renders unique metadata for $path', async (metadata) => {
    const response = await fetch(metadata.path)
    const html = await response.text()
    const head = getHead(html)
    const url = `${siteOrigin}${metadata.path}`
    const title = head.match(/<title>([\s\S]*?)<\/title>/i)?.[1]
    const canonicalTags = getTags(head, 'link')
      .filter(tag => getAttribute(tag, 'rel') === 'canonical')

    expect(response.status).toBe(200)
    expect(title).toBe(metadata.documentTitle)
    expect(canonicalTags).toHaveLength(1)
    assert.ok(canonicalTags[0])
    expect(getAttribute(canonicalTags[0], 'href')).toBe(url)
    expectUniqueMeta(head, 'name', 'description', metadata.description)
    expectUniqueMeta(head, 'property', 'og:url', url)
    expectUniqueMeta(head, 'property', 'og:title', metadata.socialTitle)
    expectUniqueMeta(head, 'property', 'og:description', metadata.description)
    expectUniqueMeta(head, 'property', 'og:type', metadata.type)
    expectUniqueMeta(head, 'property', 'og:locale', 'en_US')
    expectUniqueMeta(head, 'name', 'twitter:url', url)
    expectUniqueMeta(head, 'name', 'twitter:title', metadata.socialTitle)
    expectUniqueMeta(head, 'name', 'twitter:description', metadata.description)
    expectUniqueMeta(head, 'name', 'twitter:domain', 'caleb-smith.dev')
    expectUniqueMeta(head, 'name', 'twitter:card', 'summary_large_image')
    expectUniqueMeta(head, 'name', 'twitter:creator', '@CalebSmithDev')
    expectUniqueMeta(head, 'name', 'twitter:site', '@CalebSmithDev')
    expectUniqueMeta(head, 'property', 'og:image', defaultImageUrl)
    expectUniqueMeta(head, 'property', 'og:image:secure_url', defaultImageUrl)
    expectUniqueMeta(head, 'property', 'og:image:type', 'image/png')
    expectUniqueMeta(head, 'property', 'og:image:width', '1200')
    expectUniqueMeta(head, 'property', 'og:image:height', '630')
    expectUniqueMeta(head, 'property', 'og:image:alt', defaultSocialImage.alt)
    expectUniqueMeta(head, 'name', 'twitter:image', defaultImageUrl)
    expectUniqueMeta(head, 'name', 'twitter:image:alt', defaultSocialImage.alt)

    expect(getTags(head, 'meta').filter(tag => getAttribute(tag, 'name')?.startsWith('og:'))).toHaveLength(0)
    expect(head).not.toContain('caleb-smith.dev//')
  })
})

describe('social image', () => {
  it('serves the default social image at its stable public path', async () => {
    const response = await fetch(new URL(defaultImageUrl).pathname)

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('image/png')
  })
})
