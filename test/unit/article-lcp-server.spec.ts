import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { brotliDecompressSync } from 'node:zlib'
import { request } from 'node:http'
import { afterEach, describe, expect, it } from 'vitest'
import { createLabServer, transformTypography } from '../../scripts/performance/serve-article-lcp.ts'

const fonts = `@font-face{font-family:Poppins;font-style:normal;font-weight:700;font-display:swap;src:url(bold.woff2)}
@font-face{font-family:Poppins;font-weight:500;font-display:swap;src:url(medium.woff2)}
@font-face{font-family:Lora;font-weight:500;font-display:swap;src:url(body.woff2)}
:root{--font-heading:'Poppins',ui-sans-serif,system-ui;--font-serif:'Lora',serif}`

describe('article LCP lab controls', () => {
  it('changes only Poppins 700 display and preserves the other faces', () => {
    const optional = transformTypography(fonts, 'optional')
    expect(optional).toContain('font-weight:700;font-display:optional')
    expect(optional.match(/font-display:swap/g)).toHaveLength(2)
    expect(transformTypography(fonts, 'baseline')).toBe(fonts)
    expect(transformTypography(fonts, 'system')).toContain('--font-heading:ui-sans-serif,system-ui')
    expect(transformTypography(':root{--font-heading:Poppins,system-ui}', 'system')).toContain('--font-heading:system-ui')
  })

  const cleanups: Array<() => Promise<unknown>> = []
  afterEach(async () => {
    for (const cleanup of cleanups.splice(0).reverse()) await cleanup()
  })

  it('serves transformed Brotli HTML without changing the generated file', async () => {
    const root = await mkdtemp(join(tmpdir(), 'article-lcp-'))
    cleanups.push(() => rm(root, { recursive: true, force: true }))
    const html = `<html><style>${fonts}</style></html>`
    await writeFile(join(root, 'index.html'), html)
    const server = await createLabServer({ root, variant: 'optional' })
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
    cleanups.push(() => new Promise<void>((resolve, reject) => {
      server.close((error?: Error) => error ? reject(error) : resolve())
    }))
    const address = server.address()
    if (!address || typeof address === 'string') throw new Error('Missing TCP address')
    const result = await new Promise<{ body: Buffer, encoding: string | undefined }>((resolve, reject) => {
      request(`http://127.0.0.1:${address.port}/`, { headers: { 'Accept-Encoding': 'br' } }, (response) => {
        const chunks: Buffer[] = []
        response.on('data', chunk => chunks.push(chunk))
        response.on('end', () => resolve({ body: Buffer.concat(chunks), encoding: response.headers['content-encoding'] }))
      }).on('error', reject).end()
    })
    expect(result.encoding).toBe('br')
    expect(brotliDecompressSync(result.body).toString()).toBe(transformTypography(html, 'optional'))
    expect(await readFile(join(root, 'index.html'), 'utf8')).toBe(html)
  })

  it('rejects an experiment when no generated styles match', async () => {
    const root = await mkdtemp(join(tmpdir(), 'article-lcp-'))
    cleanups.push(() => rm(root, { recursive: true, force: true }))
    await writeFile(join(root, 'index.html'), '<h1>Fixture</h1>')
    await expect(createLabServer({ root, variant: 'optional' })).rejects.toThrow('No generated HTML/CSS matched')
  })

  it.each([true, false])('serves system CSS with compression=%s and identity without encoding negotiation', async (compression) => {
    const root = await mkdtemp(join(tmpdir(), 'article-lcp-'))
    cleanups.push(() => rm(root, { recursive: true, force: true }))
    await writeFile(join(root, 'style.css'), fonts)
    const server = await createLabServer({ root, variant: 'system', compression })
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
    cleanups.push(() => new Promise<void>((resolve, reject) => {
      server.close((error?: Error) => error ? reject(error) : resolve())
    }))
    const address = server.address()
    if (!address || typeof address === 'string') throw new Error('Missing TCP address')
    for (const encoding of ['', 'br']) {
      const result = await new Promise<{ body: Buffer, encoding: string | undefined }>((resolve, reject) => {
        request(`http://127.0.0.1:${address.port}/style.css`, { headers: { 'Accept-Encoding': encoding } }, (response) => {
          const chunks: Buffer[] = []
          response.on('data', chunk => chunks.push(chunk))
          response.on('end', () => resolve({ body: Buffer.concat(chunks), encoding: response.headers['content-encoding'] }))
        }).on('error', reject).end()
      })
      expect(result.encoding).toBe(compression && encoding ? 'br' : undefined)
      const body = result.encoding ? brotliDecompressSync(result.body) : result.body
      expect(body.toString()).toBe(transformTypography(fonts, 'system'))
    }
  })
})
