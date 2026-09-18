/**
 * What the island derives from a list of comments, decided once.
 *
 * The number on a row is the comment's place on the branch, oldest first, so it
 * does not move when a new one arrives. The reason an unpinned comment lost its
 * place is not on the wire: it is what the cascade says when the anchor is
 * tried against the page as it is now, which is the only thing that knows.
 */

import { resolveAnchor } from "@maple-kit/core/anchor";
import { matchesFilter } from "@maple-kit/core/client";

import { ORPHAN_ORDER } from "./language.js";

import type { Comment } from "@maple-kit/core";
import type { Anchor, OrphanReason } from "@maple-kit/core/anchor";
import type { CommentFilter, PickKind } from "@maple-kit/core/client";

/** The count beside one filter's pill. */
export type FilterCounts = Readonly<Record<CommentFilter, number>>;

/** Each comment's place on the branch, oldest first, keyed by id. */
export function numbersFor(comments: readonly Comment[]): ReadonlyMap<string, number> {
  const ordered = [...comments].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return new Map(ordered.map((comment, index) => [comment.id, index + 1]));
}

/**
 * The live count beside every pill. `All` subtracts the resolved ones while
 * they are hidden, because the list under it does too.
 */
export function countsFor(comments: readonly Comment[], showResolved: boolean): FilterCounts {
  const count = (filter: CommentFilter) =>
    comments.filter((comment) => matchesFilter(comment, filter)).length;

  const resolved = count("resolved");
  return {
    all: showResolved ? comments.length : comments.length - resolved,
    open: count("open"),
    needs_reverify: count("needs_reverify"),
    resolved,
    unpinned: count("unpinned"),
  };
}

/**
 * Which pick a comment was made with. A quote is a passage; a region is not
 * separable from an element on the wire, so it is not guessed at.
 */
export function kindOf(anchor: Anchor): PickKind {
  return anchor.quote === undefined ? "element" : "text";
}

/**
 * Why this comment has no place on the page, asked of the page itself. An
 * anchor that resolves again has no reason, and the row says nothing.
 */
export function orphanReason(anchor: Anchor, root: ParentNode): OrphanReason | undefined {
  const resolution = resolveAnchor(anchor, { root });
  return resolution.status === "orphaned" ? resolution.reason : undefined;
}

/**
 * The unpinned tab is a list by reason, not an empty state: the expected case
 * is that some anchors lost their place, and which way they lost it is the
 * thing worth grouping by.
 */
export function byReason(
  comments: readonly Comment[],
  reasonOf: (comment: Comment) => OrphanReason | undefined,
): readonly Comment[] {
  const rank = (comment: Comment) => {
    const reason = reasonOf(comment);
    return reason === undefined ? ORPHAN_ORDER.length : ORPHAN_ORDER.indexOf(reason);
  };
  return [...comments].sort((a, b) => rank(a) - rank(b));
}
