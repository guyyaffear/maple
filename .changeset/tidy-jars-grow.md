---
"@maple-kit/ui": patch
---

Grow a tooltip from the edge it was placed against.

`.mk-tip` scales in from `transform-origin: bottom left` whichever way it was
placed, and it prefers to sit *under* its chip — so the usual case grew upward,
into the thing it was explaining, and only the flipped case grew the right way.
`place` now sets `data-mk-below` when the tooltip landed under its anchor, and
the origin follows it.
