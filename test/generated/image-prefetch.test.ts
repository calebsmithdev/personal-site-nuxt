import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { test } from 'node:test'

const output = new URL('../../.output/public/', import.meta.url)

await test('generated pages do not speculatively fetch the image asset collection', async () => {
  const pages = (await readdir(output, { recursive: true }))
    .filter(file => file.endsWith('index.html'))
  assert.ok(pages.includes('index.html'))
  assert.ok(pages.some(page => /^blog\/.+\/index\.html$/.test(page)))

  for (const page of pages) {
    const html = await readFile(new URL(page, output), 'utf8')
    const links = html.match(/<link\b[^>]*>/g) ?? []
    assert.equal(links.some(link => /\brel="prefetch"/.test(link) && /\bas="image"/.test(link)), false, page)
    assert.ok(links.some(link => /\brel="modulepreload"/.test(link)), `${page} keeps script resource hints`)
  }
})
