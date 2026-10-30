import { pathToFileURL } from 'node:url'

const YEAR = 31536000
const kinds = {
  js: /\.(?:m?js)$/i,
  css: /\.css$/i,
  font: /\.(?:woff2?|ttf|otf)$/i,
  image: /\.(?:png|jpe?g|webp|avif|gif|svg)$/i
}

function parseCacheControl(value = '') {
  const directives = new Map<string, string[]>()
  for (const part of value.split(',')) {
    const [name, ...rest] = part.trim().toLowerCase().split('=')
    const values = directives.get(name ?? '') ?? []
    values.push(rest.join('=').replace(/^"|"$/g, ''))
    directives.set(name ?? '', values)
  }
  return directives
}

export function policyErrors(value: string, asset: boolean) {
  const directives = parseCacheControl(value)
  const errors = []
  const maxAges = directives.get('max-age') ?? []
  if (maxAges.length > 1 || maxAges.some(age => !/^\d+$/.test(age))) {
    errors.push('invalid or duplicate max-age')
  }
  if (asset) {
    for (const directive of ['public', 'immutable']) {
      if (!directives.has(directive)) errors.push(`missing ${directive}`)
    }
    if (maxAges.length !== 1 || Number(maxAges[0]) !== YEAR) {
      errors.push(`expected browser max-age=${String(YEAR)}`)
    }
    for (const directive of ['private', 'no-cache', 'no-store']) {
      if (directives.has(directive)) errors.push(`conflicting ${directive}`)
    }
  }
  else {
    if (directives.has('immutable')) errors.push('mutable response must not be immutable')
    if (!directives.has('no-cache') && !directives.has('no-store')
      && (maxAges.length !== 1 || Number(maxAges[0]) > 300)) {
      errors.push('mutable response needs no-cache, no-store, or browser max-age <= 300')
    }
  }
  return errors
}

export function discoverAssets(source: string, base: string) {
  const baseUrl = new URL(base)
  const assets = new Set<string>()
  // Covers HTML attributes, inline CSS, CSS url()/@import, and build JS strings.
  const references = source.matchAll(/[^\s"'`<>()[\]{}\\,;=]+\.(?:m?js|css|woff2?|ttf|otf|png|jpe?g|webp|avif|gif|svg)(?:\?[^\s"'`<>()[\]{}\\,;]*)?(?=[\s"'`<>()[\]{}\\,;]|$)/gi)
  for (const [reference] of references) {
    try {
      const url = new URL(reference.replaceAll('&amp;', '&'), baseUrl)
      if (url.origin !== baseUrl.origin || !url.pathname.startsWith('/_nuxt/')) continue
      // Vite's current build uses eight-character hashes, either as the chunk name
      // or before the extension. Skip library source filenames embedded in JS.
      const filename = url.pathname.split('/').at(-1)
      const hash = filename?.match(/(?:^|[.-])([\w-]{8})\.[a-z0-9]+$/i)?.[1]
      if (!hash || !/[A-Z0-9]/.test(hash)) continue
      url.hash = ''
      assets.add(url.href)
    }
    catch { /* Ignore strings that are not URLs. */ }
  }
  return [...assets].sort()
}

export async function checkAssetCache(base: string, { fetcher = fetch, log = console.log }: { fetcher?: (url: string, init?: RequestInit) => Promise<Response>, log?: (line: string) => void } = {}) {
  const origin = new URL(base).origin
  const assets = new Set<string>()
  const pages = new Set([`${origin}/`, `${origin}/blog`])
  const counts = { js: 0, css: 0, font: 0, image: 0 }
  let failures = 0

  async function inspect(url: string, kind: keyof typeof kinds | 'html' | 'manifest', { allowMissing = false } = {}) {
    const errors = []
    let source = ''
    let cacheControl = '(missing)'
    try {
      // Use GET: some hosts return different headers for HEAD. Do not follow redirects
      // or send credentials; only inspect this origin's successful responses.
      const response = await fetcher(url, { redirect: 'manual', signal: AbortSignal.timeout(15000) })
      if (allowMissing && response.status === 404) {
        await response.body?.cancel()
        log(`SKIP ${kind} ${url} (404; app manifest not present)`)
        return ''
      }
      cacheControl = response.headers.get('cache-control') ?? ''
      const contentType = response.headers.get('content-type') ?? ''
      if (response.status !== 200) errors.push(`expected 200, got ${String(response.status)}`)
      const expectedType = {
        html: /text\/html/i,
        manifest: /application\/json/i,
        js: /(?:java|ecma)script/i,
        css: /text\/css/i,
        font: /(?:font\/|application\/(?:font|x-font|octet-stream))/i,
        image: /image\//i
      }[kind]
      if (!expectedType.test(contentType)) errors.push(`unexpected Content-Type: ${contentType}`)
      errors.push(...policyErrors(cacheControl, kind !== 'html' && kind !== 'manifest'))
      if (response.status === 200 && ['html', 'js', 'css'].includes(kind) && expectedType.test(contentType)) {
        source = await response.text()
      }
      else {
        await response.body?.cancel()
      }
    }
    catch (error) {
      errors.push(`request failed: ${error instanceof Error ? error.message : String(error)}`)
    }
    log(`${errors.length ? 'FAIL' : 'PASS'} ${kind} ${url}\n  Cache-Control: ${cacheControl || '(missing)'}`)
    for (const error of errors) log(`  ${error}`)
    if (errors.length) failures++
    for (const asset of discoverAssets(source, url)) assets.add(asset)
    return source
  }

  // Include articles linked from the homepage and index, so article images are audited.
  for (const page of pages) {
    const source = await inspect(page, 'html')
    if (page === `${origin}/` || page === `${origin}/blog`) {
      for (const [, path] of source.matchAll(/href=["'](\/blog\/[^"'#?]+)[#?"']/g)) {
        const article = new URL(path ?? '', origin)
        // Prerendered payload preload links share /blog/ but are not article pages.
        if (article.origin === origin && !/\.[^/]+$/.test(article.pathname)) pages.add(article.href)
      }
    }
  }
  // Nuxt's mutable build pointer shares the asset prefix but must stay fresh.
  await inspect(`${origin}/_nuxt/builds/latest.json`, 'manifest', { allowMissing: true })
  // Sets preserve insertion order and visit newly discovered JS/CSS dependencies once.
  for (const asset of assets) {
    const kind = (Object.keys(kinds) as Array<keyof typeof kinds>).find(key => kinds[key].test(new URL(asset).pathname))
    if (!kind) continue
    counts[kind]++
    await inspect(asset, kind)
  }
  for (const [kind, count] of Object.entries(counts)) {
    if (!count) {
      log(`FAIL no ${kind} assets discovered; coverage is incomplete`)
      failures++
    }
  }
  log(`Checked ${String(pages.size)} HTML pages and ${String(Object.values(counts).reduce((a, b) => a + b, 0))} assets (${JSON.stringify(counts)}); ${String(failures)} failures.`)
  return failures
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2)
  if (args.length > 1) {
    console.error('Usage: node scripts/check-asset-cache.ts [https://caleb-smith.dev]')
    process.exitCode = 1
  }
  else {
    try {
      process.exitCode = await checkAssetCache(args[0] ?? 'https://caleb-smith.dev') ? 1 : 0
    }
    catch (error) {
      console.error(error instanceof Error ? error.message : String(error))
      process.exitCode = 1
    }
  }
}
