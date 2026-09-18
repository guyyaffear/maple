---
"@maple-kit/core": minor
---

`CommentContext` keeps the content width and the regions that were open, and
`toCommentContext` converts a captured `PageContext` into one.

The badge's headline claim — `1440 window · 1020 content · Copilot open` —
rendered in the composer and was gone the moment the comment was stored,
because nothing converted between the two shapes. `RegionContext` moves into
`types.ts` so a server-side consumer can read a stored comment without
importing from `/overlay`, and `formatContext` now takes either shape so the
badge renders identically in the composer and in the inventory.

`contentWidth` is required, and the exporter never sheds it. Regions are the
new second reduction, after `quote-context`.
