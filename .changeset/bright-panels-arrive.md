---
"@maple-kit/ui": minor
---

Add `Maple.Composer` and its five parts: `Target`, `Body`, `Context`,
`Attachments` and `Actions`.

The composer is a side panel, and the same panel as a bottom sheet at two
detents below `SHEET_BREAKPOINT_PX` — a media query rather than a variant prop.
The context badge and the target line are on screen while the comment is being
written, because that is where Maple's two differentiators have to be visible.
The panel's cost is met by insetting the preview frame where Maple serves it
and by hold-to-peek where it cannot; a pasted or dropped image previews from a
`blob:` URL before it uploads; and a link that would take an unsent comment
away is answered by a prompt naming what is at stake.
