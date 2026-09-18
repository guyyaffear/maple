/**
 * The island. One object on a page at rest, and this is it.
 *
 * The parts land in a later change. What is decided here is the vocabulary the
 * filters render and the stagger's shape, because swapping a filter must
 * replace the rows and never the card: rebuilding the island re-runs its
 * entrance and re-measures its height, and reads as a flicker.
 */

import type { CommentFilter } from "@maple-kit/core/client";

/** The five filters, in the words the pills show. `unpinned` is `orphaned`. */
export const FILTER_LABELS: Readonly<Record<CommentFilter, string>> = {
  all: "All",
  open: "Open",
  needs_reverify: "Re-verify",
  resolved: "Resolved",
  unpinned: "Unpinned",
};

/**
 * How many rows stagger before the rest arrive together. The step and the cap
 * are `--mk-stagger-step` and `--mk-stagger-cap`; this is the cap divided by
 * the step, so thirty comments do not take a second to appear.
 */
export const STAGGER_ROWS = 6;
