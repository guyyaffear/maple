---
"@maple-kit/core": minor
---

Give a draft the shape a sent comment has: `Draft.attachments` so a pasted
screenshot comes back with the draft it belongs to, and `Draft.context` as a
`CommentContext` instead of a `PageContext`.

**Breaking:** `Draft.context` changes type. Anything assigning the result of
`captureContext()` straight onto a draft now converts it first with
`toCommentContext()`. The payoff is one badge implementation across a draft and
a stored comment rather than two that drift.
