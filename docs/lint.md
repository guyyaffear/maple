# Design lint

Visual review catches what a person notices. A design system also has rules a
machine can check on every pull request, and this is where those live.

Lint reports a `Finding`, the same shape from every tier:

```ts
interface Finding {
  rule: string;
  tier: "static" | "rendered" | "judged";
  severity: "error" | "warn" | "advice";
  message: string;
  anchor: { src?: string; selector?: string; quote?: TextQuote };
  url?: string;
}
```

The anchor is the cascade's, so a finding pins on the page exactly the way a
comment does: `src` is `data-maple-src` on a build that ran the tagger, and
`selector` is the rung that is always there.

## The tiers

| Tier         | Sees                                     | May block                |
| ------------ | ---------------------------------------- | ------------------------ |
| **static**   | The source, before it is built.          | Yes                      |
| **rendered** | The page, after the browser laid it out. | Yes                      |
| **judged**   | What a model thinks of the page.         | Only when a host says so |

The deterministic tiers may gate because they are reproducible. A judged rule
defaults to `advice`: a gate that depends on a model's opinion is a gate that
changes its mind between runs.

## The rendered tier

`@maple-kit/lint` runs Chromium against a deployed preview and reads what the
cascade, the theme and the media queries finally produced. That is the point of
the tier: an off-token colour that arrived through three layers of `var()` is
invisible to a static linter and plain here.

```ts
import { lintRendered } from "@maple-kit/lint";

const findings = await lintRendered({
  url: "https://preview-123.example.app",
  tokenFiles: ["src/styles/tokens.css"],
  viewports: [{ width: 375, height: 812 }],
  bypassHeaders: { "x-vercel-protection-bypass": process.env.PREVIEW_BYPASS! },
});
```

Every tagged element — anything carrying `data-maple-src` — is read at each
viewport. An untagged build still lints; its findings anchor on the selector
alone.

### Rules

| Rule                             | What it finds                                               |
| -------------------------------- | ----------------------------------------------------------- |
| `maple/rendered-color-token`     | A text or background colour the token set does not declare. |
| `maple/rendered-type-scale`      | A font size that is not on the type scale.                  |
| `maple/rendered-touch-target`    | An interactive element under 24px on either axis.           |
| `maple/rendered-contrast`        | Text under the WCAG AA ratio for its size.                  |
| `maple/rendered-motion-property` | Motion on a property other than `opacity` or `transform`.   |
| `maple/rendered-reduced-motion`  | Motion that survives `prefers-reduced-motion`.              |

The token set is read from the `tokenFiles` the static tier is configured with,
so the two tiers cannot disagree about what a token is. A `rem` in a token file
converts at a 16px root; `ROOT_FONT_SIZE` overrides that. Only tokens whose
name reads as type (`--…-text-…`, `--…-font-…`, `--…-type-…`) form the scale,
because a spacing token is a length too and a scale that admitted them would
admit nearly any size.

### Two passes

Each viewport is read twice: once as a reviewer sees it, and once with reduced
motion emulated. A page that honours the query computes every duration to zero
under it, so whatever still moves in the second pass has hard-coded its motion.
This is the only way to tell the two apart from the outside.

### Contrast

Contrast is measured against the first opaque background at or above the
element, which is what the eye actually sees, and a translucent text colour is
composited onto it first. Large text — 24px, or 18.66px at weight 700 — is held
to 3:1 and everything else to 4.5:1, as WCAG 2.1 AA defines them.

A colour the parser cannot read, such as `color(display-p3 …)` or a named
colour, produces no finding rather than a guess.

### Viewports

With no `viewports` configured a run uses a phone, a tablet and a laptop:
375×812, 768×1024 and 1440×900. A finding at every viewport is reported once,
as written. A finding at only some of them names them, because "only on the
phone" is most of what the reader needs.

### Authentication

A run sends the preview platform's bypass as request headers and nothing else.
Reviewer cookies are never used: CI's lint run does not borrow a person's
session to see a page.
