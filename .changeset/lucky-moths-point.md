---
"@maple-kit/core": minor
---

Add `sourceFor` to `@maple-kit/core/anchor`: where the thing a comment is on is
written, as `path/to/file.tsx:line:col`.

It is `labelFor`'s sibling and reads the same way — the page first, from the
nearest ancestor carrying `data-maple-src`, then what the anchor recorded. The
page wins because the anchor records where the element was when the comment was
written, and a redeploy since has moved the line. `LabelSource.anchor` widens
from `Pick<Anchor, "component">` to include `source`.
