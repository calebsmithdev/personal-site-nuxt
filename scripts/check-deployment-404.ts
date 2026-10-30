// Check the actual HTTP serving layer after deployment, without following redirects.
const usage = 'Usage: node scripts/check-deployment-404.ts <http(s) origin>'
const articlePath = '/blog/migrating-kubernetes-pvcs-from-csi-proxmox-to-csi-cephfs'
const probes = [
  { path: '/', status: 200, content: 'id="home-heading"' },
  { path: '/blog', status: 200, content: '<title>Writing | Caleb Smith</title>' },
  { path: articlePath, status: 200, content: 'id="full-content"' },
  { path: '/blog/does-not-exist', status: 404 },
  { path: '/does-not-exist', status: 404 },
  { path: '/_nuxt/nope.js', status: 404 }
]

async function main(args: string[]) {
  let origin
  try {
    if (args.length !== 1) throw new Error()
    origin = new URL(args[0] ?? '')
    if (!['http:', 'https:'].includes(origin.protocol)
      || origin.username || origin.password || origin.search || origin.hash
      || origin.pathname !== '/') {
      throw new Error()
    }
  }
  catch {
    console.error(usage)
    console.error('Provide a site origin without credentials, a path, a query, or a fragment.')
    process.exitCode = 1
    return
  }

  for (const probe of probes) {
    let detail
    try {
      const response = await fetch(new URL(probe.path, origin), {
        redirect: 'manual',
        signal: AbortSignal.timeout(10_000)
      })
      detail = `expected ${String(probe.status)}, received ${String(response.status)}`
      let passed = response.status === probe.status
      if (passed && probe.content) {
        const html = await response.text()
        passed = (response.headers.get('content-type') ?? '').includes('text/html')
          && html.includes(probe.content)
        if (!passed) detail += ' (expected page HTML missing)'
      }
      else {
        await response.body?.cancel()
      }
      console.log(`${passed ? 'PASS' : 'FAIL'} GET ${probe.path}: ${detail}`)
      if (!passed) process.exitCode = 1
    }
    catch (error) {
      // Do not print response bodies, request URLs, or potentially sensitive errors.
      detail = error instanceof Error && error.name === 'TimeoutError' ? 'request timed out' : 'request failed'
      console.error(`FAIL GET ${probe.path}: ${detail}`)
      process.exitCode = 1
    }
  }
}

await main(process.argv.slice(2))
