import { cp, mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fetch, setup, useTestContext } from '@nuxt/test-utils/e2e'
import { describe, expect, it } from 'vitest'

// Build a disposable copy so test articles never enter the published collection.
const projectRoot = fileURLToPath(new URL('../..', import.meta.url))
const fixtureRoot = await mkdtemp(join(tmpdir(), 'nested-blog-routes-'))
const nestedPath = '/blog/nuxt/routing'
const nestedTitle = 'Nested routing fixture'
const newestArticlePath = '/blog/migrating-kubernetes-pvcs-from-csi-proxmox-to-csi-cephfs'

try {
  await Promise.all(['app', 'content', 'public', 'server', 'config', 'nuxt.config.ts', 'content.config.ts', 'package.json', 'tsconfig.json']
    .map(file => cp(join(projectRoot, file), join(fixtureRoot, file), { recursive: true })))
  await symlink(join(projectRoot, 'node_modules'), join(fixtureRoot, 'node_modules'), 'dir')
  await mkdir(join(fixtureRoot, 'content/blog/nuxt'), { recursive: true })
  await writeFile(join(fixtureRoot, 'content/blog/nuxt/routing.md'), `---
title: '${nestedTitle}'
description: 'An isolated nested article for route regression coverage.'
date: 2026-01-01
categories: ['Nuxt']
sitemap:
  lastmod: 2026-01-02
---

## Nested article body

This content must render at a nested URL.
`)
  await setup({
    rootDir: fixtureRoot,
    buildDir: join(fixtureRoot, '.nuxt'),
    env: { NUXT_PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN: '' }
  })
  const context = useTestContext()
  context.teardown ??= []
  // Nuxt awaits teardown results, although its callback type only declares void.
  const teardown: Array<() => void | Promise<void>> = context.teardown
  teardown.push(() => rm(fixtureRoot, { recursive: true, force: true }))
}
catch (error) {
  await rm(fixtureRoot, { recursive: true, force: true })
  throw error
}

const siteOrigin = 'https://caleb-smith.dev'

describe('nested article routes', () => {
  it('renders the nested article with its canonical URL', async () => {
    const response = await fetch(nestedPath)
    const html = await response.text()

    expect(response.status).toBe(200)
    expect(html).toMatch(new RegExp(`<h1\\b[^>]*>${nestedTitle}</h1>`))
    expect(html).toContain('This content must render at a nested URL.')
    expect(html).toContain(`<link rel="canonical" href="${siteOrigin}${nestedPath}">`)
    expect(html).toContain(`<meta property="og:url" content="${siteOrigin}${nestedPath}">`)
    // The fixture's lastmod (2026-01-02) is later than its date (2026-01-01).
    expect(html).toMatch(/<time\b[^>]*\bdatetime="2026-01-02"[^>]*>/)
    expect(html).toMatch(/<span\b[^>]*>Updated January 2, 2026<\/span>/)
  })

  it('keeps the blog index and adjacent article links navigable', async () => {
    const indexResponse = await fetch('/blog')
    expect(indexResponse.status).toBe(200)
    expect(await indexResponse.text()).toContain(`href="${nestedPath}"`)

    const olderResponse = await fetch(newestArticlePath)
    expect(olderResponse.status).toBe(200)
    expect(await olderResponse.text()).toMatch(new RegExp(`<a[^>]*href="${nestedPath}"[^>]*class="adjacent-link adjacent-link-newer"`))

    const nestedResponse = await fetch(nestedPath)
    expect(await nestedResponse.text()).toMatch(new RegExp(`<a[^>]*href="${newestArticlePath}"[^>]*class="adjacent-link adjacent-link-older"`))
  })

  it('includes the nested canonical URL and modification date in the sitemap', async () => {
    const response = await fetch('/sitemap.xml')
    const entries = (await response.text()).match(/<url>[\s\S]*?<\/url>/g) ?? []
    const entry = entries.find(value => value.includes(`<loc>${siteOrigin}${nestedPath}</loc>`))

    expect(response.status).toBe(200)
    expect(entry).toContain('<lastmod>2026-01-02</lastmod>')
  })

  it('returns 404 for a missing nested article', async () => {
    const response = await fetch('/blog/nuxt/__missing-nested-article__')
    expect(response.status).toBe(404)
  })
})
