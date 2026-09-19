---
"@maple-kit/core": minor
"@maple-kit/ui": minor
---

Record what a reviewer calls a preview, and which commit it was serving.

A preview hostname carries a shortened branch — a ticket key, or a name cut to
fit a DNS label — and that shortening is lossy, so the string a person reads is
not the string a store resolves a pull request from. `Comment.label` carries the
readable one and `Comment.branch` stays the identifier; `Comment.commit` carries
the exact thing the label is an abbreviation of, and is what a later re-verify
compares against.

Both are optional and set by the application: `<Maple branch label commit>` on
the component, `label` and `commit` on `MapleClientOptions`. The branch chip in
the island reads the label and keeps the branch as its title, because a label is
what you recognise and a branch is what you copy. Neither field is ever shed by
the export fence's byte budget.

The route takes both off the draft the way it already takes the branch and the
URL — the client describes its own page — and checks only that a commit is
shaped like one. The author stays the route's to decide.

**Breaking:** `MapleRootProps.options` now omits `label` and `commit` as well as
`branch`. The three are props on the component, so passing them twice could
disagree; move them out of `options`.
