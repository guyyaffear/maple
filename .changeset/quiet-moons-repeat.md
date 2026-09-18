---
"@maple-kit/ui": minor
---

Developer detail, the query string, dismissal and the island's corner.

**Developer detail.** A `detail` prop, `default` or `developer`, and Default is
the default. In Default a comment is on the Yield card or on a passage in the
retention paragraph, and that is all: the rung, the confidence, the source
line, the CSS path, the device pixel ratio and the locale are absent. In
Developer they come back as sentences rather than field names — the chip
carries the number and the tooltip carries the sentence, because a row of
comments is scanned and a sentence in a scanned row is skipped along with
everything beside it. The tooltip takes 150ms after an 80ms intent delay and
150ms to go, with no delay on the way out. Nothing is recorded differently in
either: the export fence carries every field, which is what makes Default safe.

**The query string.** `?maple=off` mounts nothing, whatever the application
says; `?maple=on` needs `allowUrlOverride`; `?maple-pos=`, `?maple-detail=`,
`?maple-comment=` and `?maple-new=` move the island, open developer detail,
select a comment and arm a pick. A link naming a comment opens the island on
it, scrolls the page to it and draws its ring — which is what a pull-request
comment deep-links to.

**Dismissal.** The island hides for the session from its own settings, the way
a framework's dev indicator does. Hidden is not gone: a comment arriving, a
pick armed or a link naming a comment brings it straight back.

**Position.** A `position` prop for each of the four corners, `bottom-right` by
default, and the pill drags: it follows the pointer, snaps to the nearest
corner and is remembered per origin — useful when the island lands on the thing
under review.
