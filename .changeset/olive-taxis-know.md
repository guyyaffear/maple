---
"@maple-kit/ui": patch
---

The strip knows there is nowhere to keep a screenshot even when the load failed.

It held the optimistic line — "taken of the page when you picked" — until
`phase` reached `ready`, which a deployment whose store refuses the reviewer
never does. So the one case the honest line exists for, a preview nobody has
signed in to yet, was the one case that never showed it.

`GET /me` is asked alongside the list rather than after it, so a failed load
has still answered this. Only a route nobody asked is unknown.
