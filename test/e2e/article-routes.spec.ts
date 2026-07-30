import { fileURLToPath } from 'node:url'
import { fetch, setup } from '@nuxt/test-utils/e2e'
import { describe, expect, it } from 'vitest'

await setup({
  rootDir: fileURLToPath(new URL('../..', import.meta.url))
})

const siteOrigin = 'https://caleb-smith.dev'
const articlePath = '/blog/migrating-kubernetes-pvcs-from-csi-proxmox-to-csi-cephfs'
const articleTitle = 'Migrating Kubernetes PVCs from csi-proxmox to csi-cephfs'
const defaultDescription = 'A full stack web developer in Kansas with a speciality focus in React, Vue, PHP, WordPress and .NET Core.'
const blogDescription = 'Practical field notes from Caleb Smith on web development, infrastructure, Kubernetes, WordPress, and SwiftUI.'
const articleDescription = 'My journey moving from Proxmox VMs to CephFS as my k8s primary data storage.'

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

const getTags = (head: string, tagName: 'link' | 'meta') => {
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
  expect(getAttribute(matches[0], 'content')).toBe(content)

  return matches[0]
}

describe('article routes', () => {
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

    expect(getTags(head, 'meta').filter(tag => getAttribute(tag, 'name')?.startsWith('og:'))).toHaveLength(0)
    expect(head).not.toContain('caleb-smith.dev//')
  })
})
