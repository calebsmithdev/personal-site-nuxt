# Cleavr retirement record

Tracking: [issue #32](https://github.com/calebsmithdev/personal-site-nuxt/issues/32).

## Verified on 2026-10-24

Production is documented in this repository as running on Laravel Cloud.
The tracked deployment files contain no Cleavr workflow, `Dockerfile`, or
`docker-compose.prod.yml`.

The GitHub repository webhook inventory contained exactly these two hooks:

| Hook ID | Callback host | Created (UTC) | Active | Events | TLS verification |
| --- | --- | --- | --- | --- | --- |
| 397885622 | `app.cleavr.io` | 2023-01-22 19:53:20 | Yes | `push` | Disabled |
| 397888261 | `app.cleavr.io` | 2023-01-22 20:21:59 | Yes | `push` | Disabled |

Both hooks matched the issue's host, creation date, subscription, and TLS
settings. Each was deleted individually through the GitHub API. A fresh,
paginated readback returned an empty webhook inventory. No Laravel Cloud or
other hooks were present, and no other webhook was deleted or modified.

These were live repository settings changes performed before this record was
committed. Merging this document does not change GitHub or hosting settings.
The deletions stop future push deliveries through these two hooks; they do not
establish that an old deployment has stopped serving traffic.

## Remaining work

Opening the Cleavr dashboard in the available browser profile redirected to
`https://app.cleavr.io/login` and showed a login form. No Cleavr connector was
available in this session. Authenticated app, server, and integration inventories
could not be read. No Cleavr app or server was deleted, and no GitHub integration
was revoked. Old-server retirement and whether it still serves the site remain
unverified. Keep issue #32 open until these checks are complete.

With authenticated access:

1. Inventory Cleavr apps, their repository and branch bindings, attached servers,
   domains, and GitHub integration use. Identify the exact resources belonging to
   this repository; a matching display name alone is insufficient. Record a
   sanitized result in the issue without credentials or account identifiers.
2. Check whether the old app or server serves this site, including any old
   hostnames or direct origin access. Compare authoritative DNS with the
   identified origins. A healthy Laravel Cloud response alone does not prove
   that an old origin is offline.
3. Remove only the confirmed obsolete app. Remove its server only after checking
   for other apps, workloads, and data that must be retained. Revoke only the
   confirmed obsolete GitHub integration after checking whether other apps use
   it. Do not delete unknown or shared resources to complete this checklist.
4. Verify the app/server removal and integration revocation in their respective
   dashboards, and confirm the identified old origin no longer serves the site.
   Record the verification date and any remaining limitations before closing #32.

## Safe webhook readback

The callback paths and query strings contain signed tokens. Do not paste full
webhook responses or callback URLs into logs, issues, or pull requests. Project
only the metadata needed for verification:

```bash
gh api repos/calebsmithdev/personal-site-nuxt/hooks --paginate \
  --jq '.[] | {id, host: (.config.url | capture("^https?://(?<host>[^/:?#]+)").host), active, insecure_ssl: .config.insecure_ssl, events}'
```

For the verified empty inventory, this command produces no hook records. If a
future inventory differs, investigate it rather than deleting hooks by host or
assuming new hooks are the retired ones. Recreating Cleavr deployment hooks would
require a separate decision and fresh secrets with TLS verification enabled.
