# Article heading LCP investigation (#29)

Issue: <https://github.com/calebsmithdev/personal-site-nuxt/issues/29>.

## Decision

Keep #29 open and preserve the production typography. The completed evidence
does not establish a repeatable font-loading improvement. This PR adds a
reproducible lab and records its limitations; it does not optimize the site.

## Measurement setup (2026-10-24 Chicago / 2026-10-25 UTC)

The app snapshot was `ea7f8157ea3ecd7da8c584e5ef1c06cf347bbd7b`.
These experiments use its static `npm run generate` output, with optional
analytics unconfigured. No app source, deployment setting, font asset, content,
or dependency changes are part of the experiments.

Tools: Node 26.12.0, Lighthouse 13.5.0, Chrome for Testing 156.0.8078.4,
Linux x64 (16 available logical CPUs). Lighthouse's mobile viewport is
412 × 823 at device scale 1.75. Its default mobile network/CPU settings are
unchanged: simulated RTT 150 ms, throughput 1638.4 Kbps; applied DevTools
latency 562.5 ms, download 1474.56 Kbps, upload 675 Kbps, CPU slowdown 4×.

A public production header check found `content-encoding: br`. The local lab
uses Brotli for HTML, CSS, JavaScript, JSON and SVG; WOFF2 is already compressed
and is sent unchanged. This matches the encoding, not the production CDN or
transport. The article document is 65,716 decoded bytes in this build.

The shared host ran other issue work during the session. Audits hold both the
validation and install locks, so cooperating builds, checks, Lighthouse runs
and installs cannot overlap them. Other desktop/OS activity is still possible.
Server responses are cached in memory after their first request; Chrome starts
fresh for every sample. Targets rotate order by round. These are local lab
measurements, not field percentiles or production PageSpeed results.

## Initial compressed baseline (simulated mobile)

Each row contains three cold-browser samples. Times are milliseconds; CLS is
unitless. The LCP element is the page's heading in every sample.

| Route | LCP samples | Median LCP | Median FCP | Median CLS | Median performance score |
| --- | --- | --- | --- | --- | --- |
| Homepage | 1107, 2104, 2103 | 2103 | 1953 | 0.000337 | 98 |
| Article | 2565, 2556, 2556 | 2556 | 2260 | 0.007941 | 94 |

Observed median LCP was 127 ms for the homepage and 183 ms for the article.
Those are the unthrottled collection timings, not simulated mobile metrics.
The homepage's first simulated sample differs substantially from the other
two, despite a slower observed paint. This spread is retained rather than
discarding the run; it limits comparisons based on small simulated differences.

## Font controls (applied DevTools throttling)

DevTools throttling applies network and CPU restrictions during collection.
These values are **observed paint timings**, not the simulated estimates in
the preceding table. Do not compare their absolute values as a before/after
optimization result.

The first two rounds completed before the severe host-load spike. Article LCP
values were:

| Control | Round 1 LCP (ms) | Round 2 LCP (ms) |
| --- | --- | --- |
| Baseline, Brotli | 861 | 886 |
| Poppins 700 optional, Brotli | 824 | 909 |
| System headings, Brotli | 803 | 833 |
| Baseline, identity encoding | 889 | 822 |

Optional Poppins was faster in one of these article rounds and slower in the
other. Its article CLS was 0.007232 in both rounds, the same as the baseline.
The system control changes heading metrics and visual appearance; its small
timing difference is not evidence for replacing the site's typography.

In the first baseline article trace, heading LCP/FCP was **861 ms**, while the
Latin Poppins 700 request completed at **1884 ms**. The heading therefore
qualified as LCP before that font arrived. This directly weakens the original
claim that this trace's LCP waits for Poppins to swap. It does not establish
how every browser, route, device or field navigation behaves.

During round 3, the host's one-minute load reached 77 on 16 available
logical CPUs, with almost all swap space used. The identity article's third
LCP was 2151 ms, compared with 889 and 822 ms earlier. The cooperating-work
locks cannot isolate unrelated host activity. Further comparisons were stopped
rather than collecting more contended samples to select a winner. Round 3 is
retained separately as raw evidence and is **not pooled into font or encoding
medians**. The optional article's third sample was not started.

[Completed samples](article-lcp-samples.csv) retain six simulated baseline
reports and 23 DevTools reports, with phase labels, timestamps, paint timings,
CLS, host load and LCP selectors. The last already-started optional-home audit
was allowed to finish, but the paused runner did not record its host-load
fields; those cells are empty. Full reports/traces were saved locally under
`/tmp/issue-29-lcp/` during this session; the CSV preserves the compact evidence
without committing large Chrome traces. A stopped matrix does not produce a
complete `medians.json`; no DevTools medians are reported here.

The earlier compressed simulated baseline is a current lab reference, not a
controlled before/after against the issue's older uncompressed measurements.
The planned matched simulated compression comparison was not launched after
severe contention appeared. No claim is made that Brotli alone accounts for
the difference from the older issue comment.

## Follow-up experiments

On a quiet host, restart every lab server against the same generated build
and rerun the DevTools matrix below with at least three complete samples per
route/control. Verify that Poppins arrives after first text paint in the
baseline and compare both LCP and CLS distributions. Retain the system-heading
arm as a diagnostic, not a proposed visual redesign. If a font change shows a
consistent gain, repeat the baseline/control comparison before changing app
CSS; check mobile line wrapping and desktop appearance as well.

Separately run the matched baseline/identity simulated comparison below to
quantify how missing compression affects this lab's estimator. Keep its
results separate from DevTools observations. A metric-matched fallback has
not been tested. No field data was collected; any future candidate still
needs validation against production serving and representative navigations.

## Correctness validation

`npm ci`, `npm run generate`, and the final `npm run check` passed on Node 26.
The full check passed lint, typecheck, all 75 tests, and the production build.
The five new harness tests cover targeted face replacement, unchanged source
files, Brotli and identity responses, CSS controls and zero-match rejection.
The CSV row counts and documented baseline medians were checked against the
saved measurements. Lab servers and the preview tab were closed after the run.

## Reproduce the lab

Use Node 26 and the committed npm lockfile. Lighthouse and Chrome are external
measurement tools, not app dependencies. Use the same versions for every
comparison. The commands below use Lighthouse 13.5.0; set `CHROME_PATH` to a
local Chrome executable and record its version. The runner requires Linux
`flock` and GNU `timeout`.

```bash
flock --close -w 45 /tmp/personal-site-nuxt-issue-install.lock npm ci &&
flock --close -w 1800 /tmp/personal-site-nuxt-issue-validation.lock npm run generate &&
flock --close -w 45 /tmp/personal-site-nuxt-issue-install.lock npm install --prefix /tmp/article-lcp-tools --no-save lighthouse@13.5.0
export LIGHTHOUSE_CLI=/tmp/article-lcp-tools/node_modules/lighthouse/cli/index.js
export CHROME_PATH=/path/to/chrome
```

Start each server in its own terminal from the repository root:

```bash
node scripts/performance/serve-article-lcp.mjs baseline 4029 br
node scripts/performance/serve-article-lcp.mjs optional 4030 br
node scripts/performance/serve-article-lcp.mjs system 4031 br
node scripts/performance/serve-article-lcp.mjs baseline 4032 identity
```

The servers bind to loopback. A human preview is available at
`https://p4029.dev1.the-smith.house` on this development host. Lighthouse uses
loopback HTTP to exclude proxy/TLS variability. Close these lab servers when
finished; they are not production servers.
Restart every lab server after generating again: responses are cached in memory.
If any setup command exits nonzero (including a lock timeout), resolve it before
continuing. The non-baseline servers refuse to start if no generated HTML/CSS
matches their control; `/__lcp-lab.json` records the changed files.

The optional control replaces `font-display: swap` with `optional` **only in
Poppins 700 font faces**, including inline styles. The system control removes
Poppins from `--font-heading` for all headings as a diagnostic. Neither changes
files in `.output/public`, the app, font assets, or content. The identity control
serves the same baseline without text compression. Brotli text responses model
the production encoding, not production CDN latency, HTTP/2, caching, or CPU.

Establish the current baseline before comparing experiments:

```bash
node scripts/performance/measure-article-lcp.mjs /tmp/article-lcp-baseline baseline=http://127.0.0.1:4029
LCP_THROTTLING=devtools node scripts/performance/measure-article-lcp.mjs /tmp/article-lcp-devtools baseline=http://127.0.0.1:4029 optional=http://127.0.0.1:4030 system=http://127.0.0.1:4031 identity=http://127.0.0.1:4032
node scripts/performance/measure-article-lcp.mjs /tmp/article-lcp-compression baseline=http://127.0.0.1:4029 identity=http://127.0.0.1:4032
```

The runner takes three cold-browser mobile samples of `/` and
`/blog/migrating-kubernetes-pvcs-from-csi-proxmox-to-csi-cephfs` per target,
rotating the target order by round. It uses simulated mobile throttling unless
`LCP_THROTTLING=devtools`, only the performance category, and a fresh Chrome
process for each sample. Each audit acquires the validation lock then the install
lock, preventing a concurrent dependency install from distorting CPU timings;
it has a 300-second timeout inside those locks. Each acquisition waits up to
1800 seconds without requeueing; a lock timeout fails separately from an audit
failure. Do not wrap the runner in
that same lock. It saves complete Lighthouse reports, traces, DevTools logs,
per-run metrics, warnings, host load averages, and medians in the output folder.
Load averages are captured before waiting for locks and after each audit; the
first is not a sample of the exact audit start if the runner had to wait.
Use an empty output folder for each experiment; the runner rejects an existing
nonempty folder and duplicate target labels to protect earlier evidence.

Compare LCP distributions and CLS for **both** routes. Inspect the LCP element,
font request timing, FCP, render-blocking CSS, and traces before attributing a
timing change to a font swap. Lighthouse's simulated metric and its observed
trace timings are different quantities; the runner records both. Default
simulation collects an unthrottled load then estimates mobile timing, which
can mask the decision to retain an optional font's fallback. Use the DevTools
run (actual network and CPU throttling) to evaluate that behavior, as described
in [Lighthouse's throttling documentation](https://github.com/GoogleChrome/lighthouse/blob/main/docs/throttling.md).
Keep typography changes only when the
mobile LCP gain repeats and CLS does not regress; a system-font control alone
does not establish that changing the site's typography is desirable.

Google's [font performance guidance](https://web.dev/learn/performance/optimize-web-fonts)
explains the trade-off: `swap` allows fallback text while loading; `optional`
can retain fallback text for the entire navigation when the font arrives late.
An LCP heading alone does not demonstrate a font-loading bottleneck.
