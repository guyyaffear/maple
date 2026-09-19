---
"@maple-kit/ui": patch
---

Let reduced motion reach the four keyframes that spelled their own distance.

`mk-island-in`, `mk-island-out`, `mk-pop-in`, `mk-row-in` and `mk-pick-in` wrote
`12px` and `6px` into the keyframe, and `prefers-reduced-motion` is honoured by
redefining the tokens rather than by switching rules off — so a reader who asked
for less motion still got the full travel, only faster. The distances are
`--mk-rise-card` and `--mk-rise-row` now, both `0px` under reduced motion, and
`stylesheet.test.ts` fails on any keyframe that spells a pixel.
