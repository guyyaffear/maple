---
"@maple-kit/ui": patch
---

Mark the row a link or a mark landed on.

`Maple.Item` has written `data-mk-selected` since the island was built and no
rule has ever read it, so a link naming a comment — and now a click on its mark
— opened the inventory onto a list with nothing in it saying which row that
was. The row takes an accent rail. It is a rail rather than a wash because the
wash is what hover already means, and the landed-on row has to stay legible
while the pointer is over another one.
