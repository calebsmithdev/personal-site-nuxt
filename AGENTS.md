# AGENTS.md

## Project

This is Caleb Smith's Nuxt 4 personal site. Use Node.js 22 (from `.nvmrc`) and npm. Treat `package-lock.json` as authoritative.

## Setup

1. Confirm `node --version` reports Node 22.
2. Run `npm ci` after a fresh checkout or whenever `package-lock.json` changes.
3. Copy `.env.example` to `.env` only when local analytics configuration is needed. Never commit `.env` or credentials.
4. Start the site with `npm run dev`; the default URL is `http://localhost:3000`.

## Working rules

- Read `README.md` and the files relevant to the requested change before editing.
- Keep changes scoped. Do not refactor unrelated code or update dependencies unless the task requires it.
- Follow the existing Nuxt, Vue, TypeScript, and ESLint patterns.
- Keep blog frontmatter compatible with `content.config.ts`.
- Regenerate homepage hero derivatives with `npm run assets:hero` only when the canonical hero image changes.
- Do not run `npm run deploy`, modify Cloudflare domains, or add deployment credentials unless explicitly requested.
- Do not hand-edit generated output in `.nuxt/`, `.output/`, `.data/`, or `public/images/homepage-homelab/`.

## Verification

- During iteration, run the narrowest relevant test or check.
- Before handing off a code change, run `npm run check`.
- If the full check cannot run, report the exact command and blocker.

## Git workflow

- Start by checking `git status --short --branch` and `git remote -v`.
- Pull with `git pull --ff-only` only when the worktree is clean. Never discard local changes to make a pull succeed.
- Work on a descriptive branch rather than committing directly to `main`, unless explicitly requested.
- Review `git diff` and `git diff --check` before committing.
- Make focused commits with an imperative Conventional Commit subject, such as `feat: add project page` or `fix: correct article metadata`.
- Never commit `.env`, credentials, generated build output, or unrelated files.
- Push with `git push -u origin HEAD`. Never force-push unless explicitly requested.

## Code review rules

- Flag behavior changes that lack appropriate tests.
- Flag changes that break canonical URLs, structured metadata, sitemap dates, typed content validation, responsive image behavior, or analytics being optional.
- Flag any secret, token, account ID, or environment-specific credential added to tracked files.
