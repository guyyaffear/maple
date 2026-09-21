---
"@maple-kit/core": minor
"@maple-kit/ui": minor
---

The score card, in the context card's slot

`Maple.Score` draws how the comment being typed reads and what kind it looks
like, in the slot the context card folds out of. It renders from `ComposerState`
and holds nothing of its own.

**A pillar is one slot per rung, filled by the probability that rung took.**
Equal widths keep *which* rung it is readable and the fill says how sure it
was, so three pale slots are visibly a shrug and one solid slot is an answer.
That is what makes the confidence legible with no key beside it — a low
confidence drawn as a fact is a lie, and a number beside a bar is a key.

The rows are laid out before there is anything to put in them, so nothing under
the card moves as the scores land, and there is no spinner per pillar: five
things moving beside a field somebody is typing in is worse than five still
ones.

**The kind is a control, not a verdict.** A reviewer's own label beats any
classifier, so the chip starts on the guess and is never stuck on it. An unsure
guess names both kinds it was torn between — "bug or request" — which says it
is unsure without a number. The choice lives in `ComposerState` and does not
yet reach the posted comment; carrying it there changes `Comment` and the
markdown fence, which is its own decision.

**`Maple.Context` is now a collapsible**, open on a pick and folded by the first
keystroke, reopening only when a reviewer asks. Folded it keeps the width,
which is the one fact anyone reads off it. A stored comment's context does not
fold: nothing is being typed beside it.

**Breaking, in `@maple-kit/ui`:** `MapleContextBadge` renders a `<section>`
wrapping its `<dl>` rather than the `<dl>` itself, so it can carry a
disclosure. Anything selecting `.mk-ctx` for the outer box wants `.mk-ctx-card`.

**Breaking, in `@maple-kit/core`:** `ComposerState` gains a required
`contextOpen`, and `AssistState` an optional `chosenKind`.
`MapleClient.setContextOpen` and `MapleClient.setKind` are new.

**Two size budgets are raised**, from 13 KB to 14 KB on the stylesheet and 9 KB
to 10 KB on the composer. The card, the chip and the disclosure are ~1.7 KB
gzipped between them, and every byte is inert on a deployment with no
classifier configured, which is the default. The reasons are in
`packages/ui/scripts/size.js` beside the numbers.
