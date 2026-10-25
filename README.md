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
| Analytics | Google Analytics through `vue-gtag`, enabled only when configured |
| Quality | ESLint, `vue-tsc`, Vitest with `@nuxt/test-utils` |
| Hosting | [Laravel Cloud](https://cloud.laravel.com) |

## Quick start

> [!NOTE]
> You need **Node.js 26** (pinned in `.nvmrc`) and **npm**. If you use nvm, run `nvm use` from the repository root first.

```bash
npm ci        # install the exact dependencies in package-lock.json
npm run dev   # start the dev server at http://localhost:3000
```

`package-lock.json` is the authoritative lockfile. After installing, npm runs `postinstall` (`nuxi prepare`) to generate Nuxt's types.

Analytics is optional. To try it locally, copy the example file and fill in the ID:

```bash
cp .env.example .env
```

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the Nuxt development server. |
| `npm run check` | Runs lint, typecheck, tests, and the production build in that order. **CI runs this same command.** |
| `npm run lint` | Lints the repository with ESLint. |
| `npm run typecheck` | Runs Nuxt's TypeScript checks. |
| `npm run test` | Runs the Vitest `unit`, `nuxt`, and `e2e` projects. |
| `npm run generate` | Prerenders the static site into `.output/public/`. |
| `npm run build` | Builds the Node/Nitro server into `.output/`. |
| `npm run preview` | Previews the latest build locally. |
| `npm run social-image` | Renders the default social card in `public/social/` from its HTML template. |
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
│   ├── pages/           # /, /blog, /blog/[slug]
│   ├── plugins/         # Optional Google Analytics plugin
│   └── utils/           # Article helpers such as date formatting
├── content/blog/        # Article Markdown files
├── public/              # Favicons, the social card, and other files served as-is
├── scripts/             # Social card template and renderer
├── test/
│   ├── unit/            # Node unit tests
│   ├── nuxt/            # Component and composable tests in the Nuxt environment
│   └── e2e/             # Tests that render real routes
├── content.config.ts    # Typed blog collection and frontmatter schema
└── nuxt.config.ts       # Modules, fonts, Markdown highlighting, site URL
```

## Writing an article

Add a Markdown file to `content/blog/`. The file path sets the URL:

```text
content/blog/example-article.md   →   /blog/example-article
content/blog/nuxt/routing.md      →   /blog/nuxt/routing
```

Every article starts with frontmatter. `content.config.ts` validates it:

```yaml
---
title: 'Article title'              # required, non-empty
description: 'One-sentence summary.' # required, non-empty
date: 2026-07-29                     # required, YYYY-MM-DD
categories: ['Nuxt']                 # required, at least one entry
tags: ['vue', 'routing']             # optional, array of strings
image: '/social/blog/cover.png'      # optional social image: a path starting with / or an https:// URL
imageAlt: 'What the image shows'     # optional, defaults to the title
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

- Canonical URLs, the sitemap, and `robots.txt` all use the site origin `https://caleb-smith.dev` from `nuxt.config.ts`.
- The homepage and blog index have the Open Graph type `website`. Articles have the type `article`.
- Every page sends the default social card, `public/social/default.png` (1200×630), as `og:image` and `twitter:image`, with its dimensions and alt text. An article's `image` frontmatter replaces the card for that article. Point it at a file in `public/` (a stable URL), an `/assets/img/...` path, or an `https://` URL. Dimensions aren't known for replacements, so they aren't sent. Use a 1200×630 image for the best previews.
- The default card is rendered from `scripts/social-image/default.html` with the site's fonts and colors. After you edit the template, run `npm run social-image` to render the PNG again. The script needs a local Chrome or Chromium (`CHROME_PATH`, or a Playwright-installed Chromium).

Google Analytics is **optional**. Set the public runtime key in `.env` to turn it on:

```dotenv
NUXT_PUBLIC_GOOGLE_ANALYTICS_ID=
```

If the value is empty, the analytics plugin doesn't start and no tracking code loads.

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

The [CI workflow](.github/workflows/ci.yml) runs on pull requests and on pushes to `main`. It reads the Node version from `.nvmrc`, caches npm, runs `npm ci`, and then runs `npm run check`. It has read-only access to repository contents, and a new run cancels any older run on the same ref.

The [GitHub security baseline](docs/github-security.md) documents repository protections and read-only API commands for verifying their live state. These settings are managed on GitHub, separately from tracked workflow configuration.

Git ignores generated output in `.nuxt/`, `.output/`, `.data/`, and `.nuxtrc`. Don't edit those files by hand.

## Build and deployment

Production runs on **[Laravel Cloud](https://cloud.laravel.com)** at `caleb-smith.dev`. The build and deploy settings live in the Laravel Cloud dashboard, not in this repository.

Nuxt can produce two kinds of output:

| Output | Commands | Result |
| --- | --- | --- |
| Node/Nitro server | `npm run build`, then `npm run start` | A server in `.output/server/index.mjs` |
| Static site | `npm run generate` | Prerendered files in `.output/public/` |

Use `npm run preview` after a build to try the production output locally. The [Nuxt deployment docs](https://nuxt.com/docs/4.x/getting-started/deployment) list every output format Nuxt supports.

Hashed `/_nuxt/*` JS, CSS, fonts, and images should use `Cache-Control: public, max-age=31536000, immutable`; HTML and mutable `/_nuxt/builds/latest.json` must keep a short browser TTL or require revalidation. See the [deployment cache policy](docs/deployment-cache-policy.md) for the scoped Laravel Cloud change, current production findings, and the repeatable `node scripts/check-asset-cache.mjs` audit. Static hosting must apply these response headers; changing Nuxt route rules alone does not configure the edge.

> [!IMPORTANT]
> This repository contains no hosting credentials. Keep tokens and account IDs in the hosting provider's secret settings, never in tracked files.

## Security headers

The versioned policy lives in [`config/security-headers.ts`](config/security-headers.ts). `nuxt.config.ts` applies it to all routes served by the Node/Nitro build. Print the exact header names and single-line values for review or host configuration with Node 26:

```bash
npm run --silent security:headers
```

The policy starts with **`Content-Security-Policy-Report-Only`**, which does not block resources. It allows Nuxt's inline payload/importmap scripts, inline styles, self-hosted fonts/images, data images, same-origin Cloudflare `/cdn-cgi/` scripts, and the existing YouTube iframe. `'wasm-unsafe-eval'` permits Nuxt Content's client-side SQLite WebAssembly compilation without allowing JavaScript `eval`. GA script, connection and image origins are permitted regardless of configuration so one policy works with analytics enabled or disabled. This permission does not load GA or enable tracking; the optional analytics plugin still requires `NUXT_PUBLIC_GOOGLE_ANALYTICS_ID`.

`Permissions-Policy: camera=(), microphone=(), geolocation=()` disables those unused features in supporting browsers, including child frames. It leaves the YouTube player's other feature permissions alone. HSTS is not changed: HTTPS support for every subdomain has not been verified.

### Apply at the static host separately

`npm run generate` produces files, not a running Nitro server. **Nuxt route rules do not make a static host send these headers.** The production header configuration remains in the Laravel Cloud dashboard or the edge that serves those files; this repository has no authenticated dashboard access or deployment configuration to update it. The public response checked on 2026-10-24 still lacked CSP and Permissions-Policy. Merging this policy alone must not be treated as live protection.

For the operator applying the policy:

1. Run `npm run --silent security:headers` and copy both exact name/value pairs into the serving host/edge's response-header configuration for all paths, including article pages and errors. Use **Report-Only**, not the enforcing `Content-Security-Policy` name. Keep the existing HSTS, `X-Content-Type-Options`, `Referrer-Policy`, and `X-Frame-Options` settings.
2. Verify actual GET response headers on the homepage, `/blog`, `/blog/how-to-connect-to-your-steam-deck-using-ftp`, and a missing article. For example, `curl -sS -D - -o /dev/null https://caleb-smith.dev/`. Compare the two values against the printed policy and confirm the new application policy remains report-only. Nitro already supplies a separate restrictive enforcing CSP on its error responses; preserve that framework behavior.
3. In a browser, inspect CSP diagnostics during client-side navigation from the blog index to an article and between articles, loading the YouTube player, and testing both configured and unconfigured analytics builds. Check Cloudflare-injected scripts on the real edge as well. The GA allowlist covers basic GA4; if Google Signals or advertising features are configured, review their extra origins against observed requests before expanding it. No report collector or `Reporting-Endpoints` is configured: there is no centralized violation collection, so header presence alone does not establish that the policy is clean.
4. Keep [issue #22](https://github.com/calebsmithdev/personal-site-nuxt/issues/22) open until the host application and live verification are complete. Tighten inline script allowances with hashes/nonces and consider enforcement only in a separate reviewed change after observing the policy on production traffic. A future collector requires a real endpoint and a separate reporting/privacy decision.

For local server verification, run `npm run build`, start it with `PORT=4022 npm run start`, then inspect GET response headers at `http://localhost:4022/`. This checks the built server only, not production static hosting. The [MDN report-only header reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy-Report-Only) explains reporting configuration and why this header cannot be supplied through an HTML meta tag.
