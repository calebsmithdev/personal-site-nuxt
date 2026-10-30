import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { createServer, type RequestListener } from 'node:http'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { describe, expect, it } from 'vitest'

const execFileAsync = promisify(execFile)
const checker = fileURLToPath(new URL('../../scripts/check-deployment-404.ts', import.meta.url))
const articlePath = '/blog/migrating-kubernetes-pvcs-from-csi-proxmox-to-csi-cephfs'
const pages: Record<string, string> = {
  '/': '<h1 id="home-heading">A known homepage</h1>',
  '/blog': '<title>Writing | Caleb Smith</title>',
  [articlePath]: '<article id="full-content">A known article</article>'
}

const correctResponse: RequestListener = (request, response) => {
  const page = pages[request.url ?? '']
  response.writeHead(page ? 200 : 404, { 'Content-Type': 'text/html; charset=utf-8' })
  response.end(page ?? '<title>Page not found</title>')
}

async function withServer(handler: RequestListener, run: (origin: string) => Promise<void>) {
  const server = createServer(handler)
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Expected an HTTP server port')
  try {
    await run(`http://127.0.0.1:${String(address.port)}`)
  }
  finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error)
        else resolve()
      })
      server.closeAllConnections()
    })
  }
}

function runChecker(args: string[]) {
  return execFileAsync(process.execPath, [checker, ...args], { timeout: 15_000 })
}

describe('deployment 404 smoke checker', () => {
  it('passes only when known pages render and all missing paths return 404', async () => {
    await withServer(correctResponse, async (origin) => {
      const { stdout, stderr } = await runChecker([origin])
      expect(stderr).toBe('')
      expect(stdout.match(/^PASS /gm)).toHaveLength(6)
      expect(stdout).toContain('PASS GET /blog/does-not-exist: expected 404, received 404')
    })
  })

  it.each(['/blog/does-not-exist', '/does-not-exist', '/_nuxt/nope.js'])(
    'fails when %s receives the homepage with status 200', async (path) => {
      await withServer((request, response) => {
        if (request.url === path) {
          response.writeHead(200, { 'Content-Type': 'text/html' })
          response.end(pages['/'])
        }
        else correctResponse(request, response)
      }, async (origin) => {
        await expect(runChecker([origin])).rejects.toMatchObject({
          code: 1,
          stdout: expect.stringContaining(`FAIL GET ${path}: expected 404, received 200`)
        })
      })
    }
  )

  it.each([301, 302, 307, 308])('fails a %s redirect without following it to a 404', async (status) => {
    let redirectTargetRequests = 0
    await withServer((request, response) => {
      if (request.url === '/blog/does-not-exist') {
        response.writeHead(status, { Location: '/redirected-not-found' })
        response.end()
      }
      else {
        if (request.url === '/redirected-not-found') redirectTargetRequests++
        correctResponse(request, response)
      }
    }, async (origin) => {
      await expect(runChecker([origin])).rejects.toMatchObject({
        code: 1,
        stdout: expect.stringContaining(`expected 404, received ${String(status)}`)
      })
      expect(redirectTargetRequests).toBe(0)
    })
  })

  it.each(Object.keys(pages))('fails if known page %s is also served as 404', async (path) => {
    await withServer((request, response) => {
      if (request.url === path) {
        response.writeHead(404)
        response.end('Not found')
      }
      else correctResponse(request, response)
    }, async (origin) => {
      await expect(runChecker([origin])).rejects.toMatchObject({
        code: 1,
        stdout: expect.stringContaining(`FAIL GET ${path}: expected 200, received 404`)
      })
    })
  })

  it('rejects a homepage fallback for a known article even with status 200', async () => {
    await withServer((request, response) => {
      if (request.url === articlePath) {
        response.writeHead(200, { 'Content-Type': 'text/html' })
        response.end(pages['/'])
      }
      else correctResponse(request, response)
    }, async (origin) => {
      await expect(runChecker([origin])).rejects.toMatchObject({
        code: 1, stdout: expect.stringContaining('(expected page HTML missing)')
      })
    })
  })

  it('fails server errors instead of accepting any non-200 status', async () => {
    await withServer((request, response) => {
      if (request.url === '/does-not-exist') {
        response.writeHead(503)
        response.end()
      }
      else correctResponse(request, response)
    }, async (origin) => {
      await expect(runChecker([origin])).rejects.toMatchObject({
        code: 1, stdout: expect.stringContaining('expected 404, received 503')
      })
    })
  })

  it('fails network errors and reports every probe without printing request URLs or error details', async () => {
    await withServer((request) => {
      request.socket.destroy()
    }, async (origin) => {
      const result = await runChecker([origin]).catch((error: unknown) => error)
      assert.ok(result instanceof Error && 'code' in result && 'stderr' in result && typeof result.stderr === 'string' && 'stdout' in result && typeof result.stdout === 'string')
      expect(result.code).toBe(1)
      expect(result.stderr.match(/^FAIL GET \S+: request failed$/gm)).toHaveLength(6)
      expect(result.stderr).not.toContain(origin)
      expect(result.stderr).not.toMatch(/ECONNRESET|fetch failed|other side closed/)
      expect(result.stdout).toBe('')
    })
  })

  it.each([
    [], ['not-a-url'], ['file:///tmp'], ['https://user:password@example.com'],
    ['https://example.com/blog'], ['https://example.com/?secret=private'],
    ['https://example.com/#fragment'], ['https://example.com', 'extra']
  ])('rejects invalid or ambiguous arguments %#', async (...args) => {
    // it.each spreads each row into this callback.
    await expect(runChecker(args)).rejects.toMatchObject({
      code: 1, stderr: expect.stringContaining('Usage: node scripts/check-deployment-404.ts')
    })
  })
})
