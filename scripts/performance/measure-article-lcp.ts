// Requires external Lighthouse/Chrome installations; adds no app dependency.
import { spawnSync } from 'node:child_process'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { loadavg } from 'node:os'
import { resolve } from 'node:path'

const [directory, ...targets] = process.argv.slice(2)
const cli = process.env.LIGHTHOUSE_CLI
const method = process.env.LCP_THROTTLING ?? 'simulate'
if (!['simulate', 'devtools'].includes(method)) throw new Error('LCP_THROTTLING must be simulate or devtools')
if (!directory || !targets.length || !cli || !process.env.CHROME_PATH) {
  throw new Error('Set LIGHTHOUSE_CLI and CHROME_PATH; pass output-directory label=http://127.0.0.1:port [...targets]')
}
const pages = {
  home: '/',
  article: '/blog/migrating-kubernetes-pvcs-from-csi-proxmox-to-csi-cephfs'
}
await mkdir(directory, { recursive: true })
if ((await readdir(directory)).length) throw new Error('Use an empty evidence directory')
const parsedTargets = targets.map((target) => {
  const separator = target.indexOf('=')
  const label = target.slice(0, separator)
  const origin = new URL(target.slice(separator + 1))
  if (separator < 1 || !/^[\w-]+$/.test(label) || !['http:', 'https:'].includes(origin.protocol)) {
    throw new Error(`Invalid target: ${target}`)
  }
  return { label, origin }
})
if (new Set(parsedTargets.map(target => target.label)).size !== parsedTargets.length) {
  throw new Error('Target labels must be unique')
}
interface LabControl { variant: string, changedFiles?: string[] }
interface NetworkRequest { url: string, networkRequestTime: number, networkEndTime: number }
interface LighthouseReport {
  runtimeError?: unknown
  lighthouseVersion: string
  fetchTime: string
  environment: { hostUserAgent: string }
  categories: { performance: { score: number } }
  audits: Record<string, { numericValue: number, details: { items: Array<NetworkRequest & { observedFirstContentfulPaint: number, observedLargestContentfulPaint: number }> } }>
  runWarnings: string[]
}
const controls: Record<string, LabControl> = {}
for (const { label, origin } of parsedTargets) {
  const response = await fetch(new URL('/__lcp-lab.json', origin))
  if (!response.ok) throw new Error(`Lab control missing: ${label}`)
  controls[label] = await response.json() as LabControl
  if (controls[label]!.variant !== 'baseline' && !controls[label]!.changedFiles?.length) {
    throw new Error(`No transformed files: ${label}`)
  }
}
await writeFile(resolve(directory, 'controls.json'), JSON.stringify(controls, null, 2) + '\n')
const rows = []
for (let run = 1; run <= 3; run++) {
  const offset = (run - 1) % parsedTargets.length
  const ordered = [...parsedTargets.slice(offset), ...parsedTargets.slice(0, offset)]
  for (const { label, origin } of ordered) {
    for (const [page, route] of Object.entries(pages)) {
      const output = resolve(directory, `${label}-${page}-${run}.json`)
      const args = [process.execPath, cli, new URL(route, origin).href,
        '--only-categories=performance', `--throttling-method=${method}`,
        '--chrome-flags=--headless=new --no-sandbox',
        '--output=json', `--output-path=${output}`, '--save-assets', '--quiet']
      const loadBeforeWait = loadavg()
      // Preserve queue position with one persistent wait, rather than requeueing.
      const result = spawnSync('flock', ['--close', '-E', '75', '-w', '1800',
        '/tmp/personal-site-nuxt-issue-validation.lock',
        'flock', '--close', '-E', '75', '-w', '1800', '/tmp/personal-site-nuxt-issue-install.lock',
        'timeout', '--kill-after=15s', '300s', ...args], { encoding: 'utf8' })
      await writeFile(output.replace(/\.json$/, '.log'), `${result.stdout ?? ''}${result.stderr ?? ''}`)
      if (result.status !== 0) throw new Error(`Audit failed or lock remained busy: ${output}, exit ${result.status}`)
      const report = JSON.parse(await readFile(output, 'utf8')) as LighthouseReport
      if (report.runtimeError) throw new Error(JSON.stringify(report.runtimeError))
      if (report.lighthouseVersion !== '13.5.0') throw new Error('Expected Lighthouse 13.5.0')
      const audits = report.audits
      const metrics = audits.metrics!.details.items[0]!
      const fontRequests = audits['network-requests']!.details.items.filter(item => /\.woff2?(?:$|\?)/.test(item.url))
      if (controls[label]!.variant === 'system' && fontRequests.some(item => item.url.includes('poppins'))) {
        throw new Error(`System control still requests Poppins: ${output}`)
      }
      rows.push({
        label, page, run, method, fetchTime: report.fetchTime,
        lighthouseVersion: report.lighthouseVersion, userAgent: report.environment.hostUserAgent,
        loadBeforeWait, loadAfterAudit: loadavg(),
        performance: report.categories.performance.score,
        fcp: audits['first-contentful-paint']!.numericValue,
        lcp: audits['largest-contentful-paint']!.numericValue,
        cls: audits['cumulative-layout-shift']!.numericValue,
        tbt: audits['total-blocking-time']!.numericValue,
        observedFcp: metrics.observedFirstContentfulPaint,
        observedLcp: metrics.observedLargestContentfulPaint,
        fontRequests: fontRequests.map(item => ({ url: item.url, start: item.networkRequestTime, end: item.networkEndTime })),
        lcpDetails: audits['lcp-breakdown-insight']?.details,
        warnings: report.runWarnings
      })
      await writeFile(resolve(directory, 'measurements.json'), JSON.stringify(rows, null, 2) + '\n')
      console.log(`${label} ${page} ${run}: LCP ${rows.at(-1)!.lcp.toFixed(0)} ms; CLS ${rows.at(-1)!.cls}`)
    }
  }
}
const median = (values: number[]) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]
const summary = []
for (const label of new Set(rows.map(row => row.label))) {
  for (const page of Object.keys(pages)) {
    const samples = rows.filter(row => row.label === label && row.page === page)
    summary.push({ label, page, runs: samples.length,
      ...Object.fromEntries(['performance', 'fcp', 'lcp', 'cls', 'tbt', 'observedFcp', 'observedLcp'].map(key => [key, median(samples.map(row => row[key as 'performance' | 'fcp' | 'lcp' | 'cls' | 'tbt' | 'observedFcp' | 'observedLcp']))])) })
  }
}
await writeFile(resolve(directory, 'medians.json'), JSON.stringify(summary, null, 2) + '\n')
console.table(summary)
