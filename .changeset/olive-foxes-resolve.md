---
"@maple-kit/core": minor
"@maple-kit/mcp": minor
---

Keep the commit that resolved a comment, instead of returning it and losing it.

`Comment.resolution` is a `CommentResolution` — the `sha` an agent says
addressed the comment, an optional `note`, and the `at` it was written. It rides
through the export fence like every other field, so the default GitHub store
persists it without a line of storage code.

`setStatus` takes it as an optional third argument and stays capability-by-
presence: a store that cannot keep a resolution still records the status.
`resolve_comment` now passes the `sha` and `note` it has always accepted, and
the route reads a resolution off the `PATCH` body but stamps `at` itself — a
client that can date its own resolution can backdate one.

A comment cannot arrive already resolved, so the route drops a `resolution`
posted with a new comment, and the shared store contract asserts a resolution
survives a re-read.
