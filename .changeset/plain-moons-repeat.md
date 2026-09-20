---
"@maple-kit/core": patch
---

Publish from CI with no npm token at all.

`release.yml` authenticates to npm by exchanging the job's OIDC token instead of
carrying a secret. `id-token: write`, the `registry-url` step and
`NPM_CONFIG_PROVENANCE` all stay — provenance and trusted publishing use the
same exchange — and `NODE_AUTH_TOKEN` is gone.

The token this replaces existed for one reason: npm registers a trusted
publisher only from an *existing* package's settings page, so the first release
could not use one. This version is the proof that the second one can.
