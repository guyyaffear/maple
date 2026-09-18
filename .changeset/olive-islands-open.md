---
"@maple-kit/ui": minor
---

Add the island: the one object a page at rest carries.

`<Maple.Island>` is a pill reading `8 open` until it is asked for, and the card
it opens into carries both halves of the job — what has been said here, and how
to say something. That is why entering comment mode has no chrome of its own:
the three picks sit on the card's bottom edge under a muted `NEW COMMENT` label,
so a page at rest never grows a second floating thing.

Twelve parts over one context — `IslandTrigger`, `IslandContent`, `Header`,
`Logo`, `Branch`, `Settings`, `Filters`, `List`, `Item`, `NewComment`,
`PickButton` — each taking `asChild`, passing `className` through, forwarding a
ref, and putting state on `data-*` rather than into a visual variant prop.

The count is open comments only, unpinned included. Unpinned is a tab rather
than an empty state, listing by the reason the anchor lost its place, in two
words with the sentence in a tooltip. Resolved comments are hidden until the
filter asks for them. Swapping a filter replaces the rows and leaves the card
alone, which a Chromium test holds to.
