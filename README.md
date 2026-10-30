<div align="center">

# caleb-smith.dev

The personal site and Markdown-powered blog of Caleb Smith.

[![CI](https://github.com/calebsmithdev/personal-site-nuxt/actions/workflows/ci.yml/badge.svg)](https://github.com/calebsmithdev/personal-site-nuxt/actions/workflows/ci.yml)
![Nuxt 4](https://img.shields.io/badge/Nuxt-4-00DC82?logo=nuxt&logoColor=white)
![Nuxt Content 3](https://img.shields.io/badge/Nuxt_Content-3-00DC82?logo=nuxt&logoColor=white)
![Node.js 26](https://img.shields.io/badge/Node.js-26-5FA04E?logo=nodedotjs&logoColor=white)
![Laravel Cloud](https://img.shields.io/badge/Hosted_on-Laravel_Cloud-FF2D20?logo=laravel&logoColor=white)

**[Visit the site →](https://caleb-smith.dev)**

<br>

<img src=".github/assets/homepage.png" alt="The caleb-smith.dev homepage: a headline reading 'I build dependable software and write down what I learn.' beside a terminal window listing recent field notes" width="900">

</div>

---

## Contents

- [Overview](#overview)
- [Quick start](#quick-start)
- [Commands](#commands)
- [Project structure](#project-structure)
- [Writing an article](#writing-an-article)
- [Images and fonts](#images-and-fonts)
- [SEO and analytics](#seo-and-analytics)
- [Testing and CI](#testing-and-ci)
- [Build and deployment](#build-and-deployment)
- [Security headers](#security-headers)

## Overview

The site has three routes:

| Route | Page |
| --- | --- |
| `/` | Homepage with an animated terminal hero and the latest articles |
| `/blog` | Index of every article |
| `/blog/<slug>` | An article, with a table of contents and syntax-highlighted code blocks that can be copied |

### Stack

| Area | Tools |
| --- | --- |
| Framework | [Nuxt 4](https://nuxt.com/docs/4.x/getting-started/installation), Vue 3, TypeScript |
| Content | [Nuxt Content 3](https://content.nuxt.com/docs/getting-started/installation), a typed `blog` collection backed by SQLite (`better-sqlite3`) |
| SEO | `@nuxtjs/sitemap`, `@nuxtjs/robots`, route-level metadata in `useSiteSeo` |
| Styling | Hand-written CSS, self-hosted Fontsource fonts, Font Awesome icons |
| Analytics | Cloudflare Web Analytics, enabled only when configured |
| Quality | ESLint with type-aware and accessibility rules, Stylelint, markdownlint, Knip, `vue-tsc`, Vitest with `@nuxt/test-utils`, commitlint |
| Hosting | [Laravel Cloud](https://cloud.laravel.com) |

## Quick start

> [!NOTE]
> You need **Node.js 26** (pinned in `.nvmrc`) and **npm**. If you use nvm, run `nvm use` from the repository root first.

```bash
npm ci        # install the exact dependencies in package-lock.json
npm run dev   # start the dev server at http://localhost:3000
```

`package-lock.json` is the authoritative lockfile. After installing, npm runs `postinstall` (`nuxi prepare`) to generate Nuxt's types.

Analytics is optional. To try it locally, copy the example file and fill in the token:

```bash
cp .env.example .env
```

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the Nuxt development server. |
| `npm run check` | Runs lint, typecheck, server/component/unit tests, the Nitro build, static generation, generated-file tests, and Knip in that order. **CI runs this same command.** |
| `npm run lint` | Runs ESLint, Stylelint, and markdownlint. |
| `npm run lint:fix` | Applies automatic JavaScript, CSS, and Markdown lint fixes. |
| `npm run knip` | Checks for unused files, exports, and dependencies. |
| `npm run typecheck` | Checks app, server, shared, config, scripts, and test TypeScript projects. |
| `npm run test` | Runs the Vitest `unit`, `nuxt`, and `e2e` projects. |
| `npm run test:generated` | Checks the static files in `.output/public/`. Run `npm run generate` first. |
| `npm run generate` | Prerenders the static site into `.output/public/`. |
| `npm run build` | Builds the Node/Nitro server into `.output/`. |
| `npm run preview` | Previews the latest build locally. |
| `npm run social-image` | Renders the default social card and one card per article in `public/social/` from their HTML templates. |
| `npm run start` | Runs the built server from `.output/server/index.mjs`. Run `npm run build` first. |

## Project structure

```text
.
├── app/
│   ├── assets/          # CSS, the profile image, and article images
│   ├── components/      # Header, footer, hero terminal, and article components
│   │   └── content/     # ProseImg and ProsePre overrides for Markdown rendering
│   ├── composables/     # useBlog, useSiteSeo, useAsset
│   ├── layouts/         # Default layout
│   ├── pages/           # /, /blog, /blog/[...slug]
│   ├── plugins/         # Optional Cloudflare Web Analytics plugin
│   └── utils/           # Article helpers such as date formatting
├── content/blog/        # Article Markdown files
├── public/              # Favicons, the social cards, and other files served as-is
├── scripts/             # Social card templates and renderer
├── test/
│   ├── unit/            # Node unit tests
│   ├── nuxt/            # Component and composable tests in the Nuxt environment
│   ├── e2e/             # Tests that render real routes through the Nuxt server
│   └── generated/       # Tests that read prerendered files directly
├── content.config.ts    # Typed blog collection and frontmatter schema
└── nuxt.config.ts       # Modules, fonts, Markdown highlighting, site URL
```

## Writing an article

Add a Markdown file to `content/blog/`. The file path sets the URL:

```text
content/blog/example-article.md   →   /blog/example-article
content/blog/nuxt/routing.md      →   /blog/nuxt/routing
```

Each directory and filename segment (without `.md`) must match
`^[a-z0-9]+(?:-[a-z0-9]+)*$`: lowercase ASCII letters and digits separated by hyphens.
Numeric ordering prefixes such as `1.` and segments named `index` are forbidden,
so article routes and social card filenames stay aligned.

Every article starts with frontmatter. `content.config.ts` validates it:

```yaml
---
title: 'Article title'              # required, non-empty
description: 'One-sentence summary.' # required, non-empty
date: 2026-07-29                     # required, YYYY-MM-DD
categories: ['Nuxt']                 # required, at least one entry
tags: ['vue', 'routing']             # optional, array of strings
image: '/social/covers/example.png'  # optional social image: a path starting with / or an https:// URL
imageAlt: 'What the image shows'     # optional alt text for the image or the article's card
sitemap:
  lastmod: 2026-07-29                # required, YYYY-MM-DD
---

Write the article body in Markdown here.
```

> [!TIP]
> When you edit a published article, update `sitemap.lastmod` so the sitemap reports the change.

Code blocks are highlighted with the `material-theme-palenight` theme. The supported languages are listed in `nuxt.config.ts`. Headings down to level 3 appear in the table of contents.

## Images and fonts

**Images.** Put article images in `app/assets/img/blog/` and reference them in Markdown as `/assets/img/blog/<filename>`. The `ProseImg` component resolves that path through the asset pipeline and adds `loading="lazy"` and `decoding="async"`.

**Fonts.** Fontsource provides self-hosted fonts, loaded before `app/assets/css/typography.css`:

| Font | Weights | Used for |
| --- | --- | --- |
| Lora | 500 | Body text |
| Poppins | 500, 700 | Headings |
| IBM Plex Mono | 400, 500 | Labels, metadata, and code |

For repeatable article-heading performance experiments, see the
[LCP lab and findings](docs/performance/article-lcp.md). Its font controls run in
a local benchmark server and do not change the site's typography.

## SEO and analytics

The homepage, blog index, and article pages each set their own title, description, canonical URL, Open Graph tags, and Twitter tags.

- `/rss.xml` is a full-content RSS 2.0 feed, linked in every page head and the footer. It includes every article, newest first, with absolute links and images.
- `robots.txt` allows search and AI retrieval crawlers while disallowing GPTBot, ClaudeBot, CCBot, Google-Extended, and Applebot-Extended. These are voluntary crawler directives; Google-Extended also controls some Gemini grounding, and Common Crawl supplies a general-purpose dataset.
- Canonical URLs, the sitemap, and `robots.txt` all use the site origin `https://caleb-smith.dev` from `nuxt.config.ts`.
- The homepage and blog index have the Open Graph type `website`. Articles have the type `article`.
- The homepage and blog index send the default social card, `public/social/default.png` (1200×630), as `og:image` and `twitter:image`, with its dimensions and alt text.
- Each article sends its own card with its title and categories: the article path under `public/social/`, so `/blog/nuxt/routing` uses `public/social/blog/nuxt/routing.png` (1200×630). Its alt text is `imageAlt`, or a sentence naming the title and Caleb Smith.
- An article's `image` frontmatter replaces its card. Point it at a file in `public/` (a stable URL), an `/assets/img/...` path, or an `https://` URL. Dimensions aren't known for replacements, so they aren't sent. Use a 1200×630 image for the best previews.
- The default card is rendered from `scripts/social-image/default.html`, and article cards from `scripts/social-image/post.html`, with the site's fonts and colors. Run `npm run social-image` and commit the PNGs after you add an article, change an article's title or categories, or edit a template. Run `npm run social-image -- posts` or `npm run social-image -- default` to render only one kind. The script shrinks long titles to fit and fails if a title still doesn't fit. It doesn't delete cards, so remove the PNG yourself when you rename or delete an article. It needs a local Chrome or Chromium (`CHROME_PATH`, or a Playwright-installed Chromium).
- `npm run test:generated` fails if an article's `og:image` is missing from the generated site or doesn't match its declared dimensions, which catches a forgotten `npm run social-image`.

### Cloudflare Web Analytics

Cloudflare Web Analytics is **optional** and cookieless. Create the site token in
the Cloudflare dashboard: **Web Analytics → Add a site → JS snippet** (under
Manage site). Set the public runtime key:

```dotenv
NUXT_PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN=
```

With an empty token, no analytics script loads. For production's static
`nuxi generate` output, set the token in the **build environment**: public runtime
configuration is baked into the generated files. Rebuild to change the token.
The manual snippet loads the beacon as a module script, which is deferred, without preload or prefetch. The plugin runs only on the server, so an unconfigured build ships no analytics code to the browser. As a result, the client-only `404.html` shell served for unknown URLs isn't tracked; Search Console reports those URLs instead.
[SPA page views are tracked automatically](https://developers.cloudflare.com/web-analytics/get-started/web-analytics-spa/).

## Testing and CI

Before you open a pull request, run the same check that CI runs:

```bash
npm run check
```

Vitest has three projects:

| Project | Files | Environment |
| --- | --- | --- |
| `unit` | `test/unit/**/*.spec.ts` | Node |
| `nuxt` | `test/nuxt/**/*.nuxt.spec.ts` | Nuxt, through `@nuxt/test-utils` |
| `e2e` | `test/e2e/**/*.spec.ts` | Node, files run one at a time |

The [CI workflow](.github/workflows/ci.yml) runs on pull requests and on pushes to `main`. It reads the Node version from `.nvmrc`, caches npm, runs `npm ci`, and then runs `npm run check`. Pull requests also validate commit messages with commitlint. It has read-only access to repository contents, and a new run cancels any older run on the same ref.

After the Vitest projects and Nitro build pass, CI runs `npm run generate` and `npm run test:generated`. The latter uses Node's test runner to read the exact home, blog index, and article HTML and payload files in `.output/public/`, plus `sitemap.xml` and `robots.txt`. Expected article routes come from `content/blog/**/*.md`, so an article the prerender crawler fails to discover still fails validation. These checks also protect canonical URLs and sitemap modification dates, and make no requests to the live site or other external services. The existing server e2e tests remain useful for Nitro behavior; they do not establish how production hosting serves missing routes.

See the [dependency advisory triage](docs/security/dependency-triage.md) for the current security findings, evidence limits, and commands to reassess them.

The [GitHub security baseline](docs/github-security.md) documents repository protections and read-only API commands for verifying their live state. These settings are managed on GitHub, separately from tracked workflow configuration.

Git ignores generated output in `.nuxt/`, `.output/`, `.data/`, and `.nuxtrc`. Don't edit those files by hand.

## Build and deployment

Production runs on **[Laravel Cloud](https://cloud.laravel.com)** at `caleb-smith.dev`. The build and deploy settings live in the Laravel Cloud dashboard, not in this repository.

**Hosting mode remains unverified.** Live responses checked on 2026-10-24 returned the homepage HTML, title, and canonical URL with status 200 for missing page paths; a separately tested local Nitro build returned 404 for those paths. The live behavior is consistent with a static homepage fallback, but does not prove a `nuxi generate` build command or rule out a proxy in front of a Nitro server. The dashboard build/start commands and served directory have not been confirmed through authenticated dashboard access. CI therefore validates both output modes; this repository change does not alter Laravel Cloud settings. See [issue #35](https://github.com/calebsmithdev/personal-site-nuxt/issues/35) for the outstanding deployment confirmation and [issue #20](https://github.com/calebsmithdev/personal-site-nuxt/issues/20) for production missing-route behavior.

Nuxt can produce two kinds of output:

| Output | Commands | Result |
| --- | --- | --- |
| Node/Nitro server | `npm run build`, then `npm run start` | A server in `.output/server/index.mjs` |
| Static site | `npm run generate` | Prerendered files in `.output/public/` |

Use `npm run preview` after a build to try the production output locally. The [Nuxt deployment docs](https://nuxt.com/docs/4.x/getting-started/deployment) list every output format Nuxt supports.

`npm run check` finishes with static output because generation follows the Nitro build. Run `npm run build` again before `npm run start` when testing the server output. For static output, deploy `.output/public/` after `npm run generate`; runtime Nitro handlers are unavailable in that artifact. Confirm the actual Laravel Cloud build command, start command (if any), and served directory before selecting either mode or removing either CI validation path. Serving rules and HTTP status codes still need separate verification on the deployed host.

Hashed `/_nuxt/*` JS, CSS, fonts, and images should use `Cache-Control: public, max-age=31536000, immutable`; HTML and mutable `/_nuxt/builds/latest.json` must keep a short browser TTL or require revalidation. See the [deployment cache policy](docs/deployment-cache-policy.md) for the scoped Laravel Cloud change, current production findings, and the repeatable `node scripts/check-asset-cache.ts` audit. Static hosting must apply these response headers; changing Nuxt route rules alone does not configure the edge.

> [!IMPORTANT]
> This repository contains no hosting credentials. Keep tokens and account IDs in the hosting provider's secret settings, never in tracked files.

## Security headers

The versioned policy lives in [`config/security-headers.ts`](config/security-headers.ts). `nuxt.config.ts` applies it to all routes served by the Node/Nitro build. Print the exact header names and single-line values for review or host configuration with Node 26:

```bash
npm run --silent security:headers
```

The policy starts with **`Content-Security-Policy-Report-Only`**, which does not block resources. It allows Nuxt's inline payload/importmap scripts, inline styles, self-hosted fonts/images, data images, same-origin Cloudflare `/cdn-cgi/` scripts, and the existing YouTube iframe. `'wasm-unsafe-eval'` permits Nuxt Content's client-side SQLite WebAssembly compilation without allowing JavaScript `eval`. Cloudflare's script origin (`https://static.cloudflareinsights.com`) and manual beacon connection origin (`https://cloudflareinsights.com`) are permitted regardless of configuration so one policy works with analytics enabled or disabled. These permissions do not load analytics; the optional plugin still requires `NUXT_PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN`.

`Permissions-Policy: camera=(), microphone=(), geolocation=()` disables those unused features in supporting browsers, including child frames. It leaves the YouTube player's other feature permissions alone. HSTS is not changed: HTTPS support for every subdomain has not been verified.

### Apply at the static host separately

`npm run generate` produces files, not a running Nitro server. **Nuxt route rules do not make a static host send these headers.** The production header configuration remains in the Laravel Cloud dashboard or the edge that serves those files; this repository has no authenticated dashboard access or deployment configuration to update it. The public response checked on 2026-10-24 still lacked CSP and Permissions-Policy. Merging this policy alone must not be treated as live protection.

For the operator applying the policy:

1. Run `npm run --silent security:headers` and copy both exact name/value pairs into the serving host/edge's response-header configuration for all paths, including article pages and errors. Use **Report-Only**, not the enforcing `Content-Security-Policy` name. Keep the existing HSTS, `X-Content-Type-Options`, `Referrer-Policy`, and `X-Frame-Options` settings.
2. Verify actual GET response headers on the homepage, `/blog`, `/blog/how-to-connect-to-your-steam-deck-using-ftp`, and a missing article. For example, `curl -sS -D - -o /dev/null https://caleb-smith.dev/`. Compare the two values against the printed policy and confirm the new application policy remains report-only. Nitro already supplies a separate restrictive enforcing CSP on its error responses; preserve that framework behavior.
3. In a browser, inspect CSP diagnostics during client-side navigation from the blog index to an article and between articles, loading the YouTube player, and testing both configured and unconfigured analytics builds. Check Cloudflare-injected scripts on the real edge as well. No report collector or `Reporting-Endpoints` is configured: there is no centralized violation collection, so header presence alone does not establish that the policy is clean.
4. Keep [issue #22](https://github.com/calebsmithdev/personal-site-nuxt/issues/22) open until the host application and live verification are complete. Tighten inline script allowances with hashes/nonces and consider enforcement only in a separate reviewed change after observing the policy on production traffic. A future collector requires a real endpoint and a separate reporting/privacy decision.

For local server verification, run `npm run build`, start it with `PORT=4022 npm run start`, then inspect GET response headers at `http://localhost:4022/`. This checks the built server only, not production static hosting. The [MDN report-only header reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy-Report-Only) explains reporting configuration and why this header cannot be supplied through an HTML meta tag.
