---
"@maple-kit/ui": minor
---

Add `@maple-kit/ui`, the composed reviewer parts, and the contract they share.

`Maple.Root` mounts one shadow root through `createOverlayHost`, adopts one
constructed stylesheet and owns the controller, so every part below it reads
state rather than taking a comment list as a prop. `theme="auto"` resolves to
the opposite of the host page's scheme, from the controller's own detection —
a guest that matches the wallpaper cannot be seen — and re-resolves when a
reviewer toggles the site's theme mid-comment.

The stylesheet is a string built from a token table, not a CSS file behind a
loader, so it stays tree-shakeable and `docs/overlay-csp.md`'s claim is still
checkable by reading one function. Every `--mk-*` is declared on `:host` in both
schemes, including the motion set: no part writes a duration or an easing, and
`prefers-reduced-motion` redefines those tokens rather than switching rules off,
so the motion is reduced and the state feedback is not removed.

The conventions the parts follow are here in code: `dataAttributes` for the five
`data-*` names, `Slot` for `asChild`, `applyReviewerSlot` for the ten OKLCH
reviewer colours, and icons as individual named exports rather than a record.
Subpath exports are granular — `/marks`, `/island`, `/composer`, `/icons` — with
no index naming every part, and the build asserts the bundle budget.

React and React DOM are peers, 18 or 19. This package never re-exports
`@maple-kit/react`, so the split that lets an application render comments in its
own design system holds.
