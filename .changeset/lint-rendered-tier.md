---
"@maple-kit/lint": minor
---

`lintRendered({ url, tokenFiles, viewports, bypassHeaders })` runs Chromium
over a deployed preview and reports what only a laid-out page can show: colours
and font sizes off the token set, touch targets under 24px, WCAG AA contrast
failures, motion on properties other than `opacity` and `transform`, and motion
that survives `prefers-reduced-motion`. Findings anchor on `data-maple-src`,
falling back to a CSS selector, so they pin on the page like a comment.
