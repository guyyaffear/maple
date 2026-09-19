---
"@maple-kit/core": minor
---

Sign a reviewer in to GitHub from a preview, with no GitHub secret in it.

Device Flow now runs through the route: `POST /auth/github` starts a link,
`PATCH /auth/github` makes one exchange attempt, `DELETE /auth/github` forgets
the token, and `GET /me` reports whether this reviewer has linked and under
which login. `RouteOptions.githubAuth` turns them on; without it they answer 404.

The reason this shape and not the redirect flow: **Device Flow's exchange needs
no client secret.** A preview environment holds the App's public client id and
nothing else. Each reviewer gets their own user-to-server token, so a
pull-request comment is authored by them rather than by a shared bot, and one
person's token is never another's.

The token and the device code are both credentials, and neither reaches the
browser. Both travel in `HttpOnly; Secure; SameSite=Lax` cookies scoped to the
route's own path. `readGitHubSession` from `@maple-kit/core/auth` is what a
store resolver calls to turn the cookie into a token. An optional `key`
encrypts the cookie with AES-GCM; `docs/github-auth.md` is honest about how
narrow that is and why `HttpOnly` is the control that carries the weight.

`DeviceFlow` gains `exchange(code)` — one attempt, for a caller doing its own
waiting. `poll` is now written over it. A person takes minutes to type a code,
and a request held open that long is a request a proxy will close.
