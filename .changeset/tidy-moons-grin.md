---
"@maple-kit/ui": patch
---

The settings panel stops at the card's bottom edge instead of being cut off by it.

`.mk-settings` hung off the header at `top: 100%` and grew to whatever height
its rows came to. The card it grows inside is `overflow: hidden` and between
330px and 460px tall, so every row past that height was simply gone: with the
GitHub sign-in row present the panel is 435px against a 330px card, which loses
**Developer mode** and **Hide the island** entirely — and nothing scrolled, so
there was no sign anything was missing.

It is now positioned against the card rather than against the header — `top:
var(--mk-head-h); bottom: 0` with `overflow-y: auto` — so it is exactly the
card's body whatever height the card is at, and taller content scrolls. The
header takes that same token as a fixed height, so the two cannot disagree.
