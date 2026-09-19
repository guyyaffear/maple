---
"@maple-kit/ui": minor
---

A mark answers to a pointer and to a click, and the panel stops sitting on the
inventory.

`Maple.MarkLayer` now defaults `onSelect` to opening the comment, so clicking a
mark reads it, rings it and opens the inventory on it; the ring a hover draws
belongs to whatever is pointed at, ahead of an open panel, and stays after the
pointer has gone once something is clicked. `RingState` gains `selected`, and
`TargetRingProps` gains `note` — the source line, under the name, in developer
detail only.

A text comment's mark now rings the passage rather than the paragraph around
it. The inventory steps aside by the panel's width instead of being covered by
it. Developer detail no longer redraws a row: its facts are a quiet footnote
rather than a dashed box each. The context badge lays its pairs out two to a
row, and a selected mark glows in the leaf's shape rather than behind its box.

The package's two budgets go up by 1 KB each, to 11 KB for the adopted
stylesheet and 20 KB for the root, marks, island and icons.
