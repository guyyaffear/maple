---
"@maple-kit/core": minor
---

Name an element the way a reviewer would, with `data-maple-label`.

`labelFor` in `@maple-kit/core/anchor` reads the nearest `data-maple-label` at
or above an element — an application writes it by hand, so one attribute on a
card names everything inside it — and otherwise unpicks the component's own
camel case into a noun phrase. `YieldCard` reads as "Yield card" and
`APIKeyCard` as "API key card"; an acronym is left as it was written.

It works from an anchor alone, so an unpinned comment still has a name in the
inventory. When nothing names the element it returns nothing, because the
surface saying "the Yield card" about the wrong card is worse than saying
nothing.

The tagger is unchanged: it never writes a label. Emitting one on every
intrinsic element would only restate the fallback, and it would end the upward
walk before a label the application wrote on the card above could be found.
