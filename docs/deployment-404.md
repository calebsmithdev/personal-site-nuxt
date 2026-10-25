# Verify deployment 404 responses

Run the smoke check with Node.js 26 **after the deployment is publicly reachable**:

```bash
node scripts/check-deployment-404.mjs https://caleb-smith.dev
```

Pass the origin of the environment being checked. The command makes six GET requests,
does not follow redirects, and exits with status 1 if any check fails. Each request
times out after ten seconds. It needs no credentials or npm dependencies.

| Path | Required response |
| --- | --- |
| `/` | 200, homepage HTML |
| `/blog` | 200, blog index HTML |
| `/blog/migrating-kubernetes-pvcs-from-csi-proxmox-to-csi-cephfs` | 200, article HTML |
| `/blog/does-not-exist` | 404 |
| `/does-not-exist` | 404 |
| `/_nuxt/nope.js` | 404 |

The known-page controls catch a blanket 404 rule and a homepage fallback for existing
articles. Keep the article control aligned with a published article if its URL changes.
The missing paths are reserved smoke-check fixtures; do not publish content at them.
A redirect to the homepage or to a separate error URL fails: the original unknown URL
must return 404. The checker verifies status codes for missing paths, not the visual
design of the error page.

This is a separate post-deploy gate. A successful `npm run check` tests the local
Nitro build; inspecting generated static artifacts validates files. Neither proves
that the live hosting layer preserves missing-route status codes. Run this command from the CI
runner or operator machine that can reach the deployed environment, after rollout,
and fail that smoke-check step when it exits nonzero. Running it during an isolated
build does not test the newly deployed release.

## Current production evidence

On 2026-10-24, direct GET requests to `https://caleb-smith.dev` showed:

```text
PASS GET /: expected 200, received 200
PASS GET /blog: expected 200, received 200
PASS GET /blog/migrating-kubernetes-pvcs-from-csi-proxmox-to-csi-cephfs: expected 200, received 200
FAIL GET /blog/does-not-exist: expected 404, received 200
FAIL GET /does-not-exist: expected 404, received 200
PASS GET /_nuxt/nope.js: expected 404, received 404
```

Both missing page responses contained the homepage title and canonical URL
`https://caleb-smith.dev/`. This is consistent with an HTML fallback or rewrite,
but does **not** establish the configured build command, start command, served
directory, or which layer rewrites the response. The Cloudflare server header also
does not identify the origin process.

The available browser profile reaches Laravel Identity's sign-in page, with no
authenticated Laravel Cloud dashboard access. Hosting commands and routing settings
remain unverified. No deployment settings or domains were changed. Keep
[issue #20](https://github.com/calebsmithdev/personal-site-nuxt/issues/20) open until
the production smoke check passes after an authorized hosting correction.

## Hosting correction to review

First inspect the environment's actual deployment settings and latest deployment
logs: build command, start command, output directory, and any proxy or edge fallback.
Choose the matching serving mode below; changing Nuxt route rules alone cannot fix
an external static server's fallback.

### If the environment serves generated static files

The required configuration is:

- Build with `npm ci` and `npm run generate`; serve `.output/public/`.
- Serve existing files and prerendered directory indexes normally, including
  `/blog/index.html` and `/blog/<slug>/index.html`.
- Serve `/blog` and `/blog/<slug>` with 200 at those exact URLs, without redirecting
  to a trailing-slash URL. The site's canonical URLs omit that slash, and the
  checker fails redirects on known pages as well as missing paths.
- When no file or directory index exists, internally serve `.output/public/404.html`
  with HTTP **404** at the original URL. Disable fallback rewrites to `index.html`
  or `200.html` that return 200. Preserve 404 for missing assets too.

Nuxt's default generated `404.html` is a client-side shell, so a raw HTML response
may have no rendered error message. Check its browser-rendered result at the
original unknown URL as well as the HTTP status; an empty shell alone does not
mean the HTTP correction failed.

For an Nginx static server whose configuration is under your control, the equivalent
server-block fragment is below. Replace the root placeholder with the deployed
absolute path. This is a configuration proposal, not a confirmed Laravel Cloud
dashboard option or a change applied by this repository:

```nginx
root /absolute/deployment/path/.output/public;
index index.html;

location / {
    try_files $uri $uri/index.html =404;
}

error_page 404 /404.html;
location = /404.html {
    internal;
}
```

Nginx's [try_files](https://nginx.org/en/docs/http/ngx_http_core_module.html#try_files)
and [error_page](https://nginx.org/en/docs/http/ngx_http_core_module.html#error_page)
directives preserve the 404 while serving the custom error document. Do not use
`error_page 404 =200 /index.html`. If the managed host exposes no equivalent
configuration, ask hosting support to apply the serving contract above; do not
assume that committing an Nginx file configures the host.

### If the environment runs the Node/Nitro server

Build with `npm ci` and `npm run build`, then run `npm run start`
(`node .output/server/index.mjs`). Confirm that the environment routes unknown page
requests to that process and preserves its status, without a proxy/edge rewrite to
the homepage. A static directory alone does not run Nitro's missing-article handling.

Laravel Cloud's current [Nuxt guide](https://laravel.com/cloud/docs/deploy-guides/nuxt)
describes choosing server rendering or static generation when creating an app.
For server mode it describes starting `.output/server/index.mjs` and routing to
the injected `PORT`. These are documented options, not this environment's verified
configuration.

### Acceptance after an authorized change

Run the smoke command against the public production origin after rollout. All six
checks must pass, including the real article. Inspect an unknown page in a browser
and its HTTP response to confirm the intended error document is served at the
original URL. Only then record the deployed release and verification date and
resolve #20. A passing local static
server or Nitro run is useful comparison evidence, not proof that production changed.
