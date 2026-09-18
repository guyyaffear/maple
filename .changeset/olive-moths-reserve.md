---
"@maple-kit/core": minor
---

Reserve `Comment.parentId` for replies, which Maple does not ship.

Maple has one body per comment: a comment is a request for a change and it is
answered by a commit, not by a sentence. Nothing sets `parentId`, nothing reads
it, and the composer offers no way to make one.

It is on the wire type anyway so that changing that decision stays additive. The
flat list is already a one-level grouping by `parentId` where every value is
`undefined`, so adding replies later is a UI change plus a composer affordance
rather than a schema migration.

`docs/replies.md` records the decision and what revisiting it costs in the island
and in the export. The exporter keeps one row per comment, preserves the caller's
order and never infers order from `createdAt`, which is what leaves room for an
indented row later.
