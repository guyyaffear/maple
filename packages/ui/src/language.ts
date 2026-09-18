/**
 * The words a reviewer reads, where a wire value is not one of them.
 *
 * `orphaned` stays the wire type; the word shown is "Unpinned", because
 * orphaned sounds like a failure and about a quarter of anchors end up there
 * over time. Three parts render these, so they are spelled once: three
 * spellings of "Needs re-verify" is what a parallel build produces otherwise.
 */

import type { CommentStatus } from "@maple-kit/core";

/** The four statuses, in the words the island, the mark and the composer use. */
export const STATUS_LABELS: Readonly<Record<CommentStatus, string>> = {
  open: "Open",
  resolved: "Resolved",
  needs_reverify: "Needs re-verify",
  orphaned: "Unpinned",
};
