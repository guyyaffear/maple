/**
 * The words a reviewer reads, where a wire value is not one of them.
 *
 * `orphaned` stays the wire type; the word shown is "Unpinned", because
 * orphaned sounds like a failure and about a quarter of anchors end up there
 * over time. Several parts render these, so they are spelled once: three
 * spellings of "Needs re-verify" is what a parallel build produces otherwise.
 * The sentences live beside their labels, because a label shown without the
 * sentence somewhere is a word a reviewer has to guess the meaning of.
 */

import type { CommentStatus, IdentityProvenance } from "@maple-kit/core";
import type { OrphanReason, Rung } from "@maple-kit/core/anchor";

/** The four statuses, in the words the island, the mark and the composer use. */
export const STATUS_LABELS: Readonly<Record<CommentStatus, string>> = {
  open: "Open",
  resolved: "Resolved",
  needs_reverify: "Needs re-verify",
  orphaned: "Unpinned",
};

/**
 * What each status means. The chip carries two words and the panel carries
 * this: a reviewer who has not read the docs is looking at a word, not at a
 * state machine.
 */
export const STATUS_SENTENCES: Readonly<Record<CommentStatus, string>> = {
  open: "nobody has claimed to have addressed this yet",
  resolved: "an agent claimed a commit for it; re-check it and say whether it is done",
  needs_reverify: "it was resolved, and the page has changed under it since",
  orphaned: "the page has nowhere left to put it; the comment is kept, only its place is lost",
};

/**
 * How much an author's name is worth, said as the dot that draws it. The fill
 * is the whole of this signal and no word beside it repeats it, so the sentence
 * names the shape a reader is looking at.
 */
export const PROVENANCE_SENTENCES: Readonly<Record<IdentityProvenance, string>> = {
  server: "a filled dot: the application's own session verified who this is",
  client: "a half-filled dot: the application said who this is, and nothing checked it",
  guest: "a hollow dot: nobody verified this, they typed a name into Maple",
};

/**
 * How a rung reads inside a sentence. It is never shown as a field name: the
 * number is the value and this says what the number is about.
 */
export const RUNG_LABELS: Readonly<Record<Rung, string>> = {
  key: "the app's own key",
  source: "the source line",
  component: "the component name",
  quote: "the quoted text",
  selector: "a CSS path",
};

/** What a percentage reads as, for anyone not looking at it. */
export function rungLabel(percent: number): string {
  return `${String(percent)}%`;
}

/** Two words each. The sentence underneath belongs in the tooltip, not the row. */
export const ORPHAN_LABELS: Readonly<Record<OrphanReason, string>> = {
  empty: "No anchor",
  missing: "Nothing matches",
  ambiguous: "Several matches",
  changed: "Text changed",
};

/** What the chip's tooltip says after its two words. */
export const ORPHAN_SENTENCES: Readonly<Record<OrphanReason, string>> = {
  empty: "Written before the build tagged anything, so there was never anything to search for.",
  missing: "Every rung was tried. The element is gone, or this is a different route.",
  ambiguous: "More than one element answers to what was recorded, and nothing tells them apart.",
  changed:
    "The passage is still on the page, but edited past the point where the match can be trusted.",
};

/** The order the unpinned tab groups its rows in. */
export const ORPHAN_ORDER: readonly OrphanReason[] = ["missing", "changed", "ambiguous", "empty"];

/** The chip's full tooltip: the two words, then the sentence. */
export function orphanTitle(reason: OrphanReason, tried: readonly Rung[] = []): string {
  const ladder = tried.length === 0 ? "" : ` Tried: ${tried.map(rungWord).join(" → ")}.`;
  return `${ORPHAN_LABELS[reason]}. ${ORPHAN_SENTENCES[reason]}${ladder}`;
}

/** One rung, as it appears in a list of the ones that were tried. */
function rungWord(rung: Rung): string {
  return RUNG_LABELS[rung];
}

/** The panel's labels, and the sentence under each of the ones worth one. */
export const DETAIL_COPY = {
  author: "Written by",
  status: "Status",
  rung: "Found again by",
  rungNote: "after a redeploy Maple re-finds it that way, and a lower rung is worth less",
  lost: "Nothing to pin to",
  area: "Area",
  areaNote: "of the box it was drawn in, which is what moves it when the layout does",
  source: "Source",
  selector: "CSS path",
} as const;
