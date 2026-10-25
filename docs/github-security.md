# GitHub security baseline

Repository: `calebsmithdev/personal-site-nuxt`. Tracked documentation does not
configure GitHub settings. An administrator applied the settings below through
GitHub's API for [issue #15](https://github.com/calebsmithdev/personal-site-nuxt/issues/15).
Recheck live state after policy changes or repository transfers.

## Expected settings

| Setting | Expected state |
| --- | --- |
| Secret scanning | Enabled |
| Secret scanning push protection | Enabled |
| Dependabot alerts | Enabled |
| Dependabot security updates | Enabled, not paused |
| CodeQL default setup | Configured for `javascript-typescript` and `actions`, default query suite |
| GitHub Actions | Enabled, selected actions only, full-length commit SHAs required |
| Allowed external actions | GitHub-owned and Marketplace verified creators; no extra patterns |
| Default workflow permissions | Read |
| Actions can approve pull requests | Disabled |

Readback verified this baseline on 2026-10-24. The initial
[CodeQL validation run](https://github.com/calebsmithdev/personal-site-nuxt/actions/runs/40159537853)
successfully analyzed both JavaScript/TypeScript and Actions. The API reports
JavaScript and TypeScript aliases alongside `javascript-typescript` and schedules
weekly analysis.

Before restricting actions on 2026-10-24, the default branch contained only
`.github/workflows/ci.yml`, using `actions/checkout` and `actions/setup-node`.
Both actions were already pinned to full commit SHAs. The workflow explicitly
grants only `contents: read`. GitHub's managed CodeQL setup runs separately;
there is no custom CodeQL workflow to maintain.

The existing effective `main` rules were preserved: pull requests with resolved
review threads, a strict required `check` status, and blocked deletion and
force pushes. The rules currently require zero approving reviews. Do not replace
the ruleset merely to change security or Actions settings.

Dependabot version-update configuration in `.github/dependabot.yml` is separate
from the GitHub setting that enables security-update pull requests.

## Read-only verification

Use an authenticated GitHub CLI session with repository administration read
access. Do not print authentication tokens. These commands only read settings;
an API error means verification is incomplete, not that protection is disabled.

```bash
set -euo pipefail
repo=calebsmithdev/personal-site-nuxt

gh api "repos/$repo" --jq '.security_and_analysis | {
  secret_scanning,
  secret_scanning_push_protection,
  dependabot_security_updates
}'
# Each status must be "enabled".

gh api "repos/$repo/vulnerability-alerts" --silent
# Exit 0 (HTTP 204) means Dependabot alerts are enabled.
gh api "repos/$repo/automated-security-fixes"
# enabled: true, paused: false

gh api "repos/$repo/code-scanning/default-setup" \
  --jq '{state,languages,query_suite}'
# configured; actions and javascript-typescript; default
# Setup is asynchronous: inspect its validation run before treating empty
# languages or a pending setup as successful analysis.

gh api "repos/$repo/actions/permissions" \
  --jq '{enabled,allowed_actions,sha_pinning_required}'
# true; selected; true
gh api "repos/$repo/actions/permissions/selected-actions"
# github_owned_allowed: true, verified_allowed: true, patterns_allowed: []
gh api "repos/$repo/actions/permissions/workflow"
# default_workflow_permissions: read, can_approve_pull_request_reviews: false

gh api "repos/$repo/rules/branches/main" --jq 'map({type,parameters})'
# deletion, non_fast_forward, pull_request, required_status_checks
```

Review new workflow `uses:` entries against the allowlist and full SHA policy.
Inspect CodeQL analysis results in the repository's **Security → Code scanning**
view; configured settings alone do not establish a successful analysis or the
absence of vulnerabilities. Secret scanning covers supported patterns and does
not make it safe to commit credentials.

API references: [repository security settings](https://docs.github.com/en/rest/repos/repos#update-a-repository),
[Actions permissions](https://docs.github.com/en/rest/actions/permissions), and
[CodeQL default setup](https://docs.github.com/en/rest/code-scanning/code-scanning#update-a-code-scanning-default-setup-configuration).
