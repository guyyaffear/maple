# Conventions in `@maple-kit/ui`

**Status:** in force. Every part in this package follows all of it, and a part
that does not is a review comment rather than a preference.

`@maple-kit/react` is headless and stops at hooks. This package is the composed
parts. Nothing here may be depended on by `@maple-kit/react`, and nothing here
re-exports it: an application rendering comments in its own design system
depends on that package and pulls in none of these.

## State goes on `data-*`, never into props

`dataAttributes(state)` in `src/data.ts` is the only place the five names are
spelled: `data-status`, `data-form`, `data-confidence`, `data-provenance`,
`data-armed`. A part spreads what it returns and writes no attribute for state
it did not claim.

Styling then belongs to whoever owns the stylesheet rather than to a prop.
There is no `variant`, no `tone` and no `size` on any part. `formFor` and
`confidenceFor` beside it turn a comment into the two values the mark reads.

## `asChild` everywhere

Every part takes `asChild` and renders `Slot` from `src/slot.ts` in place of its
own element. Handlers compose, `className` and `style` merge, and both refs are
called, so an application can hand a part its own button and keep the focus ring
and the analytics already on it. Every part also passes `className` through and
forwards a ref.

## No visual variant props

There is no `<Maple.Composer variant="sheet">`. There is `<Maple.Composer>` and
a media query at `SHEET_BREAKPOINT_PX`, because the sheet **is** the panel under
640px. The stylesheet carries that as `--mk-composer-w` and `--mk-composer-r`.

## One module per part, and no index naming them all

The exports map is granular — `.`, `./marks`, `./island`, `./composer`,
`./icons` — and each subpath is its own module graph. A single index naming
every part is how tree-shaking quietly stops working across bundler versions.
Factory calls carry `/** @__PURE__ */`, and icons are individual named exports
rather than an `ICONS` record, which is retained whole the moment anything
indexes it dynamically.

## Styling is a token contract

`src/tokens.ts` holds every `--mk-*` and `src/stylesheet.ts` builds the sheet
from it. No part writes a colour, a radius, a duration or an easing of its own;
`packages/ui/test/stylesheet.test.ts` fails if a rule spells one.

Four tokens are never declared and only ever arrive through `setProperty`:
`--mk-slot`, `--mk-slot-ink`, `--mk-pin` and `--mk-pin-ink`. A reviewer's colour
is `applyReviewerSlot(element, slot)` and never a generated rule per reviewer.

Host classes do not exist inside the shadow root. Nothing may assume Tailwind,
the application's fonts or its custom properties: the overlay declares its own
system stacks and inherits nothing, which is what keeps `font-src` untouched.

### Motion

Surface motion — open, close, slide, resize, reposition — is
`--mk-ease-surface`. Overshoot is `--mk-ease-entrance` and belongs to entrances
alone: a mark landing, a count popping. **Never bounce a close, and never delay
a close or a hover-out.** The ring and the marks are repositioned per scroll
frame and must carry no transition on their position; only opacity and first
appearance animate.

`prefers-reduced-motion` redefines the same tokens rather than switching rules
off: every duration lands at or under 100ms and distance, pre-scale and stagger
collapse to nothing, so what is left is the opacity. The motion is reduced; the
state feedback is not removed.

## The bundle budget

Marks, the island, the icons and the root they need stay under 25 KB gzipped,
and the composer costs its own 8 KB on top. `packages/ui/scripts/size.js` runs
as the second half of this package's `build`, so the existing CI build job
enforces it. It measures this package's own emitted modules; `react` is a peer
and the other two workspace packages carry their own budgets.

A part reaching for an icon imports it relatively, not through
`@maple-kit/ui/icons`, or its weight is counted against nothing.

## What the CSP claim needs from a part

`docs/overlay-csp.md` is the claim. In this package it means: one shadow root,
styled only through `createOverlayStyleSheet`; positions set with
`style.setProperty()` and never by assigning `cssText`; no workers; and nothing
that constructs a `CSSStyleSheet`, reads `localStorage` or touches `document` at
module scope. `packages/ui/test/surface.test.ts` fails on any of them.
