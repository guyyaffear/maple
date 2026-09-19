---
"@maple-kit/core": minor
---

A region is the rectangle a reviewer drew, not the element under its middle.

`CommentAnchor.region` records it as fractions of the smallest element that
holds the whole of it, so a page that lays out wider moves the rectangle with
the thing it was over. `containerFor` in `@maple-kit/core/overlay` finds that
box; `regionOf` and `regionBox` in `@maple-kit/core/anchor` convert both ways.
A region pick now carries that element on the `Pick`, and `targetFor` no longer
returns nothing when a rectangle covered no element — `documentElement` is a box
too, and a rectangle over the page's own background is still a rectangle.

`kindOf(anchor)` moves to `@maple-kit/core/anchor` and is the one answer to
which pick made a comment. The controller, the mark layer and the island each
guessed at it separately, which is two chances to disagree. `PickKind` moves to
the domain vocabulary with it, because the anchor reads it back off a stored
comment and the client cannot also own the word.

`MediaRef.source` says who attached an image: `capture` is Maple's own, taken at
pick time without being asked, and a reader of a written comment had no other
way to tell that from one the author chose.
