---
"@maple-kit/lint": minor
---

`lintRendered({ url, tokenFiles, viewports, bypassHeaders })` runs Chromium
over a deployed preview and reports what only a laid-out page can show: colours
and font sizes off the token set, touch targets under 24px, WCAG AA contrast
failures, motion on properties other than `opacity` and `transform`, and motion
that survives `prefers-reduced-motion`. Findings carry the anchor cascade's own
`Anchor`, and `findingComment()` turns one into a `Comment` the overlay pins
where it was found.

Colours are read as hex in all four lengths, `rgb()`, `hsl()`, `color(srgb …)`
and the 148 named colours; anything wider is named in a warning rather than
silently narrowing what the run checked.
