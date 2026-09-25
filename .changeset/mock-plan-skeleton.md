---
"@maple-kit/mock": minor
"@maple-kit/ui": minor
---

`MockClientState.thinking` is true while the route reads the box's sentence,
and not while it is still being typed. The box draws a chip-sized skeleton in
the suggestion's place for that wait, with a slow sweep across it that stands
still under reduced motion, so the wait reads as work and the chip replaces it
without moving anything. Two motion tokens join the contract:
`--mk-dur-shimmer` and `--mk-shimmer-sweep`.
