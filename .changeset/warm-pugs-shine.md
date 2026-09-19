---
"@maple-kit/ui": patch
---

Stop the focus ring squaring off every pill in the overlay.

The shared `:focus-visible` rule set `border-radius: var(--mk-r-xs)` alongside
the outline, so a 999px control — the pill, the pick buttons, the tally dots,
the branch chip, the switch — snapped to 5px corners the moment it took focus,
and snapped back on blur. An outline already follows the control's own corners;
the rule sets only the outline now, and the two controls that carry no radius
of their own (`.mk-more` and `.mk-tipped`) are given one.
