# Caleb Smith personal site

This repository contains the portfolio and Markdown-backed writing site for Caleb Smith. It is built with [Nuxt 4](https://nuxt.com/docs/4.x/getting-started/installation/) and [Nuxt Content 3](https://content.nuxt.com/docs/getting-started/installation), with server-rendered route metadata, generated static assets, and a typed content collection.

## Requirements

- Node.js 22, matching `.nvmrc`
- npm

`package-lock.json` is the authoritative dependency lockfile. If you use nvm, run `nvm use` from the repository root before installing dependencies or running project commands.

## Local setup

Install the locked dependencies:

```bash
npm ci
```

Analytics is optional. To configure it locally, copy the value-free example and set the public analytics ID in `.env`:

```bash
cp .env.example .env
```

Start the development server:

```bash
npm run dev
```

The site is available at <http://localhost:3000>.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Nuxt development server. |
| `npm run build` | Build the production Node/Nitro server into `.output/`. |
| `npm run deploy` | Generate the static site and deploy it to Cloudflare Workers Static Assets. |
| `npm run generate` | Prerender the static site into `.output/public/`. |
| `npm run preview` | Preview the latest Nuxt output locally; run `npm run build` first when validating the Node server output. |
| `npm run start` | Run the built Node server from `.output/server/index.mjs`; requires `npm run build` first. |
| `npm run lint` | Lint the repository with ESLint. |
| `npm run typecheck` | Run Nuxt's TypeScript checks. |
| `npm run test` | Run the Vitest unit, Nuxt-environment, and end-to-end projects. |
| `npm run check` | Run lint, typecheck, tests, and the production build in sequence. |
| `npm run assets:hero` | Regenerate the responsive homepage hero derivatives with Sharp. |
| `npm run postinstall` | Generate Nuxt types with `nuxi prepare`; npm runs this automatically after installation. |

## Project structure

| Path | Purpose |
| --- | --- |
| `app/` | Nuxt application entry point, routes, layouts, components, composables, plugins, styles, and source images. |
| `content/blog/` | Markdown source for the blog collection. |
| `content.config.ts` | Typed Content 3 collection and frontmatter validation. |
| `public/` | Files served as-is, including favicons and generated responsive hero images. |
| `scripts/` | Deterministic asset-generation scripts. |
| `test/` | Vitest unit, Nuxt-environment, and end-to-end tests. |
| `.github/workflows/` | GitHub Actions verification workflow. |

## Writing an article

The `blog` collection reads `content/blog/**/*.md`. A file at `content/blog/example-article.md` maps to `/blog/example-article`; nested directories add the same path segments beneath `/blog`.

Every article must provide non-empty `title` and `description` strings, a `date` in `YYYY-MM-DD` format, at least one non-empty `categories` entry, and a `sitemap.lastmod` date in the same format:

```yaml
---
title: 'Article title'
description: 'One-sentence summary.'
date: 2026-07-29
categories: ['Nuxt']
sitemap:
  lastmod: 2026-07-29
---
```

The optional `image` field is a string. The optional `tags` field is an array of strings. Write the article body as Markdown below the frontmatter.

## Images and fonts

Article images live under `app/assets/img/`. Reference a local blog image in Markdown as `/assets/img/blog/<filename>`; the custom `ProseImg` component resolves that source through the application asset graph and applies lazy loading with asynchronous decoding.

The canonical homepage hero is `app/assets/img/homepage-homelab-v1.png`. Run `npm run assets:hero` to generate its 640, 1024, and 1536 pixel AVIF, WebP, and JPEG derivatives under `public/images/homepage-homelab/`. The generator expects the canonical source to be 1536 by 1024 pixels and produces deterministic output.

Fonts are self-hosted with Fontsource. The application loads Lora 500 and Poppins 500 and 700 before the site typography stylesheet.

## SEO and analytics

The homepage, blog index, and article routes each define route-specific titles, descriptions, canonical URLs, Open Graph metadata, and Twitter metadata. Canonical URLs use `https://caleb-smith.dev`; route types are `website` for the homepage and blog index and `article` for articles. The sitemap and robots output use the same configured site origin.

Google Analytics is optional. Set the public runtime key in `.env` only when analytics should be enabled:

```dotenv
NUXT_PUBLIC_GOOGLE_ANALYTICS_ID=
```

When the value is empty, the analytics plugin does not initialize.

## Verification and CI

Run the same local quality gate used by CI:

```bash
npm run check
```

Vitest is split into Node unit tests, Nuxt-environment component/composable tests, and Node end-to-end route tests. The GitHub Actions workflow runs on pull requests and pushes to `main`, reads Node from `.nvmrc`, restores the npm cache, runs `npm ci`, and then runs `npm run check`. The workflow has read-only repository contents permission and cancels superseded runs for the same workflow and ref.

Generated Content and test-tool files under `.data/` and `.nuxtrc` are ignored.

## Build and deployment

For a Node/Nitro server, build and start the application:

```bash
npm run build
npm run start
```

For compatible static hosting, generate the prerendered site and publish the contents of `.output/public/`:

```bash
npm run generate
```

Use `npm run preview` after `npm run build` to validate the production server locally. See the official [Nuxt deployment documentation](https://nuxt.com/docs/4.x/getting-started/deployment) for the output models supported by Nuxt.

## Cloudflare deployment

The production site is deployed as a static Cloudflare Worker. `wrangler.jsonc`
publishes `.output/public/` and attaches the `caleb-smith.dev` custom domain;
there is no runtime origin or homelab tunnel involved.

For a local authenticated deployment:

```bash
npm run deploy
```

For Cloudflare Workers Builds, connect this GitHub repository and use:

- Build command: `npm run generate`
- Deploy command: `npx wrangler@4.120.0 deploy`
- Production branch: `main`

The repository does not contain Cloudflare credentials. If using an external
CI provider instead of Workers Builds, store `CLOUDFLARE_API_TOKEN` and
`CLOUDFLARE_ACCOUNT_ID` as provider secrets. The token should be scoped only to
the target account and Worker deployment permissions.

Before the first custom-domain deployment, remove the existing
`caleb-smith.dev` tunnel DNS record. Wrangler will create the Worker custom
domain and its DNS record. Keep the tunnel route available until the new
Worker has been verified, then remove the old homelab origin configuration.
