---
"@maple-kit/core": minor
---

Give a reviewer a stable colour slot.

`CommentAuthor.colorSlot` is an integer from 0 to 9, into the ten OKLCH hues a
mark is drawn in. Hue was a per-page assignment, so two reviewers commenting
from two machines could be drawn as the same person; the route now derives the
slot from a hash of the author's id instead, and the answer is the same in every
process.

It is assigned where the author is — from the identity connector, never from the
request body. A client that can choose its own slot can choose someone else's. A
guest still gets whatever the page has free, assigned in the browser.
