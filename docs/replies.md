# Replies

**Status:** decided, not built. `Comment.parentId` is reserved in
`packages/core/src/types.ts` and nothing sets it.

## What was decided

Maple ships with one body per comment. There is no reply, no thread, and no
affordance in the composer for either.

A comment in Maple is a request for a change, and it is answered by a commit
rather than by a sentence. The agent loop already has somewhere to put its
answer — the resolution, the diff, the check run — so a thread would be a second
place for the same information to live, and the two would disagree. Where a
conversation genuinely belongs, the default store is a GitHub pull request and
GitHub already threads it.

That is a judgement about what Maple is for, not a claim that nobody will ever
want replies. It is written down here because it is the kind of decision that
gets revisited, and revisiting it should start from what it costs rather than
from scratch.

## What `parentId` reserves

`Comment.parentId?: string` is on the wire type today. It is never written, never
read, and never rendered. Its only job is to make adding replies later an
additive change to a published type instead of a breaking one.

The list of comments is flat and keyed by `id`. Read it as a one-level grouping
by `parentId`: every value is `undefined` today, so the grouping is the identity
function and costs nothing at runtime. A store that round-trips a `Comment`
already round-trips the field — the default store persists through the export
fence, which encodes whatever the comment carries.

## Revisiting it changes the inventory's shape, not its contents

This is the part worth knowing before anyone reopens the question. Adding replies
does not add data to the inventory; it stops the inventory from being a list.

Every surface that renders comments today renders a sequence. A reply makes it a
two-level structure, and each of these has to answer a question it does not
currently have:

- The island's list renders rows in one order. With replies it renders parents
  in one order and children under them, and the filters have to say whether a
  reply matching a filter drags its parent into view, or is hidden with it.
- The count on the pill says how many comments are open. It would have to decide
  whether a reply is a comment for that purpose. If it is, a busy thread outvotes
  five untouched comments.
- The address — the number in the mark, in the list row and in the export table —
  is a comment's identity to a reviewer moving between the page and the pull
  request. A reply either has no address or needs one that reads as subordinate
  (`3.1`), and the mark on the page has no room for the second form.
- A reply has no anchor of its own. It inherits its parent's, which means the
  mark, the ring and the unpinned tab all need to know not to draw it twice.

None of that is hard. All of it is design, and none of it is a schema migration.
That asymmetry is the whole point of reserving the field.

## What would have to change in the island

`parentId` becomes a grouping key rather than a dead one: the list groups by it,
renders parents in order, and renders each parent's children beneath it. The
composer gains one affordance — a reply action on a list row that pre-fills
`parentId` and reuses the parent's anchor. Nothing else in the picker, the marks
or the ring participates.

## What would have to change in the export

`exportMarkdown` writes one table row per comment and the fence carries the
comments in the order it was handed them. A reply would be an indented row under
its parent, which means the table's numbering has to become an address rather
than a position, and the exporter has to sort a flat array into parent-then-
children order before it numbers anything.

Two things about the exporter today make that possible, and both must stay true:

- **It does not sort.** It preserves the caller's order, so the caller stays free
  to hand it parents and children already interleaved.
- **It does not infer time from position.** Nothing in `src/export/markdown.ts`
  reads `createdAt` or assumes row order is creation order. The row number is
  computed from the array index and is presentation only.

The second is the one to guard. A future change that treats row order as creation
order — sorting by position, or reading a timestamp off an index — would foreclose
the indented form without anyone noticing, because with no replies in existence
the two orders are identical.

## The claim, stated exactly

> Adding replies to Maple is a UI change plus one composer affordance. It is not
> a schema migration, and it does not reshape what a store holds.

Anything that would break that sentence — a reply needing a field `Comment` does
not have, a store needing to be told about threads, an exporter that has to be
reordered before it can be indented — means this decision has stopped being cheap
to revisit, and should be reopened deliberately rather than discovered.
