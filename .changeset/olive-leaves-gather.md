---
"@maple-kit/ui": minor
---

Add the marks and the target ring at `@maple-kit/ui/marks`.

The mark is a maple leaf, not a speech bubble: a bubble would mean "chat happens
here", which is a promise Maple does not make. Three signals share it without
sharing a pixel — the fill says how far through its life a comment is, the edge
says how sure the anchor is, the colour says its status. The half-filled form is
a clip outside the rotation, so the waterline stays horizontal while the leaf
stays tilted, and the number inside is the address the island's list and the
export table also show, so a reviewer moving between the pull request and the
page never translates. The same leaf is the avatar, where provenance is the
whole of the signal and none of the three tooltips says the word "guest".

`Maple.MarkLayer` draws one mark per pinned comment and `Maple.TargetRing` rings
what a composer is open on, or what a reviewer is pointing at, with a label
naming it in `labelFor`'s words. Both are measured and moved per scrolled frame
through `setProperty`, never transitioned: a transition on a position lags a
frame behind the page and reads as broken. A passage draws one rectangle per
line from `Range.getClientRects()`, and the collision resolver steps a mark
sideways until its hit area clears its neighbours', so no two marks can be
clicked wrong.

An unpinned comment draws no mark and is never snapped to the nearest ancestor:
a comment silently attached to the wrong element looks answered, which is worse
than one that admits it is lost.

Every part takes `asChild`, passes `className` through and forwards its ref; no
part takes a visual variant. The marks' rules are their own module, composed
into the one adopted stylesheet, and they spell no duration, no easing and no
colour of their own.
