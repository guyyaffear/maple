---
"@maple-kit/core": minor
---

`@maple-kit/core/auth` gains `createInstallationAuth`, which mints and caches an
installation token for Maple's own GitHub App.

This is what lets the SDK route publish a check run. Device Flow signs a
reviewer in and acts as them; a check run can only be written by an App acting
as itself, which is the second App `docs/github-auth.md` argues for. The token
is cached for its hour and given up five minutes early, so a resolve never pays
for a mint and a request that starts valid cannot finish expired.

Nothing broke: this is new surface.
