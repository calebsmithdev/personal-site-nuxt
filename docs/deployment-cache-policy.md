# Deployment cache policy

Tracking issue: [#28](https://github.com/calebsmithdev/personal-site-nuxt/issues/28).

## Required production policy

Apply this policy only to successful, content-addressed build assets on `caleb-smith.dev`:

```text
Path: /_nuxt/*
Exclude: /_nuxt/builds/* (in particular the mutable latest.json build pointer)
Response: successful JS, CSS, font, or image file (not an HTML fallback/error)
Set response header (replace, do not append):
Cache-Control: public, max-age=31536000, immutable
```

Require both the `/_nuxt/` path and a hashed JS/CSS/font/image filename, with the build-manifest exclusion above; do not use a site-wide wildcard, a bare prefix rule, or an extension-only rule. Nuxt changes the asset URL when its contents change. Never overwrite an existing hashed URL with different contents. Nuxt also places mutable build metadata under `/_nuxt/builds/`, which must not receive the asset policy.

Keep HTML (`/`, `/blog`, and article routes) and `/_nuxt/builds/latest.json` on `no-cache`, `no-store`, or a browser `max-age` of at most 300 seconds, without `immutable`. The current browser `max-age=0, must-revalidate` is acceptable. Do not apply the asset policy to unversioned public files, content payloads, redirects, or error responses. A long `s-maxage` sets CDN freshness, not browser freshness, and cannot substitute for `max-age`.

## Apply in Laravel Cloud

This is an external hosting change. Repository changes and local build results do not establish that production headers have changed. For a static deployment, Nitro middleware and Nuxt `routeRules` do not run when the host serves `.output/public/`. The removed Cloudflare Workers `public/_headers` file is not a Laravel Cloud configuration mechanism.

1. An authorized operator should open the existing production application's environment in Laravel Cloud and inspect its **Edge network** settings and static-file serving configuration. Confirm the current deployment output before choosing where to apply the header.
2. If the environment offers a path-scoped response-header/cache policy, apply the exact rule above. It must control the browser-facing `Cache-Control`, not just the CDN TTL. Keep the HTML policy separate.
3. If that control is unavailable, ask Laravel Cloud support to apply the scoped rule or identify the supported static-file response-header mechanism. Do not replace it with a global one-year browser TTL. The authenticated dashboard and plan-specific controls were unavailable during this audit, so no specific custom-rule UI is assumed.
4. Use the host's supported cache invalidation mechanism for affected assets so cached headers are refreshed, then run the audit below against normal asset URLs. Do not rely on cache-busting query strings or a local preview.

Laravel Cloud's [network documentation](https://laravel.com/cloud/docs/network#cache-control) describes origin cache-header handling, the Edge network card, and cache purging. It documents custom cache rules for dedicated Private Cloud edge networks; it does not establish that every environment has an arbitrary path-scoped response-header editor.

No dashboard, deployment setting, domain, or credential was changed by this repository work. Leave #28 open until the live audit passes.

## Production observation

The GET audit on **2026-10-25 UTC** (2026-10-24 in America/Chicago) checked 14 HTML pages and 104 hashed assets: 46 JS, 8 CSS, 46 fonts, and 4 images. All HTML passed the browser TTL guard. All 104 assets failed the required policy: the observed browser TTL was 300 seconds, with no `immutable`. Representative responses:

```text
/                                      public, max-age=0, s-maxage=31536000, must-revalidate
/_nuxt/8-Y2Ap5z.js                      public, max-age=300, s-maxage=31536000
/_nuxt/error-404.DpKY_dMl.css            public, max-age=300, s-maxage=31536000
/_nuxt/ibm-plex-mono-cyrillic-400-normal.BSMlKf0J.woff2
                                       public, max-age=300, s-maxage=31536000
/_nuxt/63-01-20240411-hide-field-labels-01.BJ6CylLc.png
                                       public, max-age=300, s-maxage=31536000
```

These are observations, not deployment configuration. The hashes will change on later deployments; use discovery rather than copying these URLs for future validation.

## Reproduce the audit

With Node.js 26:

```bash
node scripts/check-asset-cache.mjs
# Optional: audit another deployment origin
node scripts/check-asset-cache.mjs https://your-preview.example
```

The command needs network access, but no credentials or build. It issues GET requests, discovers `/_nuxt/` references in the homepage, blog index, linked articles, and JS/CSS dependencies, and prints only cache headers, URLs, and validation results. It does not execute page scripts or analytics. It checks status and content type to catch HTML fallbacks, requires one-year `public` + `immutable` browser caching for discovered assets, and checks short-lived HTML and the mutable `/_nuxt/builds/latest.json` separately. A 404 for that optional manifest is skipped. It fails if JS, CSS, fonts, or images are absent from discovery. Exit code 0 means all checks passed; 1 means a policy, response, network, or coverage failure.

Discovery audits referenced assets, not every file on the server. It recognizes current eight-character Vite filename hashes containing uppercase letters or digits, excluding embedded library source filenames; revisit discovery if that output convention changes. Review its category counts; the script cannot prove that an unreferenced asset or a future deployment has the same policy. Run it again after changing hosting rules or deploying new output. The normal `npm run check` uses offline regression fixtures; it does not require production to be fixed and does not run this network audit.
