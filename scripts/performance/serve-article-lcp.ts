// Lab-only static server: never imported by the app or used for deployment.
import { readFile, readdir, realpath, stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, relative, resolve, sep } from 'node:path'
import { brotliCompressSync } from 'node:zlib'

const types: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon'
}

export function transformTypography(source: string, variant: string) {
  if (variant === 'optional') {
    return source.replace(/@font-face\s*\{[^}]*\}/g, (face) => {
      if (!/font-family:\s*["']?Poppins["']?\s*(?:;|\})/i.test(face)
        || !/font-weight:\s*700\s*(?:;|\})/.test(face)) return face
      return face.replace(/font-display:\s*swap/, 'font-display:optional')
    })
  }
  if (variant === 'system') {
    return source.replace(/(--font-heading\s*:)\s*["']?Poppins["']?\s*,/g, '$1')
  }
  return source
}

export async function createLabServer({ root, variant = 'baseline', compression = true }: { root: string, variant?: string, compression?: boolean }) {
  if (!['baseline', 'optional', 'system'].includes(variant)) {
    throw new Error(`Unknown font variant: ${variant}`)
  }
  const publicRoot = await realpath(root)
  const cache = new Map<string, { body: Buffer, compressed: Buffer | null, type: string }>()
  const changedFiles: string[] = []
  // Validate against actual generated HTML/CSS before any measurements start.
  for (const entry of await readdir(publicRoot, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !['.html', '.css'].includes(extname(entry.name))) continue
    const file = resolve(entry.parentPath, entry.name)
    const source = await readFile(file, 'utf8')
    if (transformTypography(source, variant) !== source) changedFiles.push(relative(publicRoot, file))
  }
  if (variant !== 'baseline' && !changedFiles.length) {
    throw new Error(`No generated HTML/CSS matched the ${variant} control`)
  }

  return createServer(async (request, response) => {
    try {
      if (!['GET', 'HEAD'].includes(request.method ?? '')) {
        response.writeHead(405).end()
        return
      }
      const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname)
      if (pathname === '/__lcp-lab.json') {
        response.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
          .end(JSON.stringify({ variant, compression, changedFiles }))
        return
      }
      let file = resolve(publicRoot, `.${pathname}`)
      if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html')
      file = await realpath(file)
      if (!file.startsWith(publicRoot + sep)) {
        response.writeHead(403).end()
        return
      }
      if (!cache.has(file)) {
        const extension = extname(file)
        let body = await readFile(file)
        const text = ['.html', '.css', '.js', '.json', '.svg'].includes(extension)
        if (['.html', '.css'].includes(extension)) {
          body = Buffer.from(transformTypography(body.toString(), variant))
        }
        cache.set(file, {
          body,
          compressed: text && compression ? brotliCompressSync(body) : null,
          type: types[extension] ?? 'application/octet-stream'
        })
      }
      const asset = cache.get(file)
      if (!asset) throw new Error('Missing cached asset')
      const useBrotli = asset.compressed && /\bbr\b/.test(request.headers['accept-encoding'] ?? '')
      const body = useBrotli && asset.compressed ? asset.compressed : asset.body
      response.writeHead(200, {
        'Content-Type': asset.type,
        'Content-Length': body.length,
        'Cache-Control': 'no-store',
        Vary: 'Accept-Encoding',
        ...(useBrotli ? { 'Content-Encoding': 'br' } : {})
      })
      response.end(request.method === 'HEAD' ? undefined : body)
    }
    catch (error) {
      const missing = error instanceof Error && 'code' in error && ['ENOENT', 'ENOTDIR'].includes(String(error.code))
      if (!missing) console.error('LCP lab response failed:', error instanceof Error ? error.message : String(error))
      response.writeHead(missing ? 404 : 500).end()
    }
  })
}

if (import.meta.main) {
  const [variant = 'baseline', port = '4029', encoding = 'br'] = process.argv.slice(2)
  if (!['br', 'identity'].includes(encoding)) throw new Error('Encoding must be br or identity')
  const server = await createLabServer({
    root: resolve('.output/public'), variant, compression: encoding === 'br'
  })
  server.listen(Number(port), '127.0.0.1', () => {
    console.log(`LCP lab: ${variant}, ${encoding}, port ${port}`)
  })
}
