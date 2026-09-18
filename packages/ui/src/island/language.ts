/**
 * Every word the island says, in one module.
 *
 * `orphaned` stays the wire type and "Unpinned" is what a person reads: about a
 * quarter of anchors lose their place over time, so the word may not sound like
 * a failure. The four reasons are two words each with the sentence in a
 * tooltip, because a list of comments is scanned rather than read.
 */

import type { OrphanReason } from "@maple-kit/core/anchor";
import type { CommentFilter, PickKind } from "@maple-kit/core/client";

/** The five filters, in the words the pills show. `unpinned` is `orphaned`. */
export const FILTER_LABELS: Readonly<Record<CommentFilter, string>> = {
  all: "All",
  open: "Open",
  needs_reverify: "Re-verify",
  resolved: "Resolved",
  unpinned: "Unpinned",
};

/** The order the filters are shown in. Unpinned is last: it is the tab. */
export const FILTER_ORDER: readonly CommentFilter[] = ["all", "open", "needs_reverify", "resolved"];

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

/** The three picks, in the order the island's bottom edge shows them. */
export const PICK_ORDER: readonly PickKind[] = ["element", "text", "region"];

/** The word on each pick button. */
export const PICK_LABELS: Readonly<Record<PickKind, string>> = {
  element: "Element",
  region: "Region",
  text: "Text",
};

/** One sentence per setting: what it does, not what it is called again. */
export const SETTINGS_COPY = {
  hideResolved: {
    name: "Hide resolved",
    hint: "Done comments stay off the page and out of the list until you pick the Resolved filter.",
  },
  developer: {
    name: "Developer mode",
    hint: "Shows how each comment is re-found after a deploy, its source line and its CSS path.",
  },
} as const;

/** Copy with no better home than a name. */
export const ISLAND_COPY = {
  title: "Comments",
  settings: "Settings",
  close: "Close the inventory",
  closeGlyph: "✕",
  newComment: "New comment",
  empty: "Nothing here under this filter.",
  showAll: "Show all",
  showLess: "Show less",
  attachment: "shot",
} as const;

/** The pill's own words. One number, and it is the open one. */
export function openLabel(count: number): string {
  return `${String(count)} open`;
}

/** What a screen reader hears on the collapsed pill. */
export function triggerLabel(count: number): string {
  return `Open Maple: ${openLabel(count)}`;
}

/** A pick button's tooltip. `t` cycles the three while one is armed. */
export function pickTitle(kind: PickKind): string {
  return `Comment on ${kind} — press t while picking to cycle`;
}

/** The chip's full tooltip: the two words, then the sentence. */
export function orphanTitle(reason: OrphanReason): string {
  return `${ORPHAN_LABELS[reason]}. ${ORPHAN_SENTENCES[reason]}`;
}

/**
 * What a comment is on, in the words a reviewer would use. A passage is in
 * something and a region is an area of it; an element is simply its own name.
 */
export function kindPhrase(kind: PickKind, human: string | undefined): string {
  if (human === undefined) return "somewhere on this page";
  if (kind === "text") return `a passage in ${human}`;
  return kind === "region" ? `an area of ${human}` : human;
}
