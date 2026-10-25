# Dependency advisory triage

Reviewed 2026-10-24 (America/Chicago) for [issue #18](https://github.com/calebsmithdev/personal-site-nuxt/issues/18), including its [maintenance update](https://github.com/calebsmithdev/personal-site-nuxt/issues/18#issuecomment-6381272382).
Baseline: `ea7f8157ea3ecd7da8c584e5ef1c06cf347bbd7b`, Node `26.12.0`, npm `11.20.0`.
The authoritative `package-lock.json` SHA-256 is `0443326561df0cebdcbeaf2c1684af43041ac01a6d79376ad42cb018abe60502`.

Keep #18 open. Two active advisories remain; this record does not suppress or fix them. No dependency, override, or CI policy changes are made here. Dependency removal is handled separately in #23.

## Fresh audit and upstream status

`npm ci` completed successfully. The subsequent installed-tree `npm audit --json` reports **7 high package findings**, with zero findings at other severities. These are two underlying advisories, including affected parent packages:

| Advisory | Locked path | Findings | Current resolution |
| --- | --- | --- | --- |
| [GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv): RSA signature verification | `nuxt@4.6.2` → `@nuxt/nitro-server@4.6.2` → `nitropack@2.13.5` → `listhen@1.10.1` → `node-forge@1.4.0` | 5, one per package in this path | Advisory lists no patched version; npm registry latest is still `node-forge@1.4.0`. |
| [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5): memory exhaustion during collection validation | `@nuxt/content@3.16.2` → `zod@3.25.76` | 2: Content and Zod | Advisory affects versions below `4.6.6`; no Zod 3 patch. Registry latest Content remains `3.16.2`, requiring `zod ^3.25.76`. |

The maintenance comment's total of seven is correct, but the current JSON groups them as **five node-forge and two Zod findings**, rather than six and one. A package finding count is not an exploit count.

`npm audit --omit=dev --json` still reports **2 high findings** (`@nuxt/content` and `zod`). It drops the node-forge chain because Nuxt is a devDependency and the lockfile marks all five packages in that path as development dependencies. npm dependency classifications do not establish what executes in a deployed server.

[`braces` GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) was **withdrawn on 2026-10-23** because the advisory was assessed as not practically exploitable. Locked `braces@3.0.3` remains installed, but this advisory is absent from the fresh audit. Remove it from the active list; its disappearance is not evidence of a package patch.

The audit's proposed remedies remain `nuxt@4.1.3` and `@nuxt/content@2.13.4`. Do not run `npm audit fix --force`: these are downgrades, and Content 2 does not support this project's Content 3 collections and `queryCollection` API. Do not override Zod 3 with Zod 4 without an upstream migration and compatibility validation.

## Reachability evidence and limits

- **Verified in project source:** [`content.config.ts`](../../content.config.ts) imports Zod through `@nuxt/content` and selects repository Markdown through `blog/**/*.md`. Its `tags` and `categories` arrays have no maximum length. No project-authored endpoint accepts frontmatter or user-supplied schemas; module-registered routes have not been assessed. This establishes Content's configured input source, not absence of all possible vulnerable calls in dependencies.
- **Additional locked Zod consumers:** Content's `zod-to-json-schema@3.25.2` peer and `nuxtseo-shared@6.0.3`'s optional peer resolve to the same hoisted Zod 3. `nuxtseo-shared` is used by robots, sitemap, and `nuxt-site-config`. Robots and sitemap also resolve that Zod against incompatible optional `^4.6.5` peers. These resolutions do not prove vulnerable parsing calls. The maintenance comment's claim that the latter peers are used only by unused `/content` entry points has not been independently verified here.
- **Verified in installed source:** Content's `dist/module.mjs` imports Zod and `zod-to-json-schema`. Robots/sitemap's `dist/content.mjs` import Zod and `nuxtseo-shared/content`; the project does not import these helpers. In listhen's `dist/shared/listhen.tqe5I1Rl.mjs`, certificate helpers generate RSA keys, sign certificates, and parse configured PFX/PEM material. These inspected call sites support the development-certificate explanation; they do not prove that the vulnerable signature-verification code is unreachable through every path.
- **Inference, limited to Content's Markdown input:** owner-authored, reviewed Markdown limits exposure to malicious collection inputs during content processing. Treat untrusted contributions and dependency changes as reasons to reassess; build-time execution alone does not make an advisory harmless. Input handling and runtime reachability through the additional consumers remain unverified.
- **Unverified output/deployment claim:** the maintenance comment says Zod is absent from `.output/server`. No fresh artifact inspection is recorded here, so that claim remains unverified by this assessment. The Laravel Cloud dashboard and running deployment were not inspected either.

## Repeat the assessment

Use Node 26 and the committed lockfile. On this shared host, serialize dependency operations with the install lock and full build/check suites with the validation lock. `--close` prevents children from retaining locks; a lock timeout is contention, so retry after other work completes.

```bash
node --version
npm --version
sha256sum package-lock.json
flock --close -w 45 /tmp/personal-site-nuxt-issue-install.lock npm ci

npm audit --json > /tmp/personal-site-audit.json
npm audit --omit=dev --json > /tmp/personal-site-audit-production.json
npm explain node-forge
npm explain zod
npm explain braces
npm ls zod node-forge braces --all

npm view @nuxt/content@latest version dependencies.zod
npm view node-forge@latest version
flock --close -w 45 /tmp/personal-site-nuxt-issue-validation.lock npm run check
```

Audit exits 1 when findings remain; inspect the JSON for `metadata.vulnerabilities`, advisory URLs, paths, and proposed fixes. A network/registry error is an unsuccessful audit, not a clean result. Keep JSON captures local rather than committing a stale full dependency inventory.

The installed-tree `npm ls` above also exited 1 with `ELSPROBLEMS`: the root `zod@3.25.76` does not satisfy robots/sitemap's optional `^4.6.5` peers. The existing [`.npmrc`](../../.npmrc) uses `legacy-peer-deps=true`; a successful install does not resolve that mismatch. Track it with the upstream migration rather than forcing an incompatible Zod override.

For a future output assessment, first let the check above build fresh output, then inspect the server's traced dependencies and search output, excluding source maps. These are follow-up commands, not evidence already collected. Text searches can miss bundled or renamed code and are supporting evidence, not a reachability proof:

```bash
rg --files --hidden --no-ignore .output | rg '(^|/)(zod|node-forge|braces)(/|$)'
rg -l --hidden --no-ignore --glob '!*.map' 'node-forge|ZodError|ZodObject|ZodArray|DigestAlgorithm' .output/server .output/public
```

## Follow-up and closure

1. Watch the linked advisories and Content's Zod migration. Re-audit whenever the lockfile changes; refresh this dated snapshot when #23 or other dependency work lands.
2. Prefer a compatible upstream update. Consider a narrowly scoped override only once a patched version exists and its consumer supports it; coordinate lockfile ownership first.
3. Run `npm ci` and `npm run check`, inspect the resulting artifact, and reassess input paths after any candidate fix. A future Content/Zod migration must also preserve frontmatter validation, canonical routes, and sitemap dates.
4. Close #18 only when a fresh full audit confirms all tracked active advisories are resolved. Until then, link work with `Refs #18`. Do not add blanket suppressions or a broad CI audit gate as part of this triage.
