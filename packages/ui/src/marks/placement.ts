/**
 * Which comments have a place on the page, and what number each one carries.
 *
 * An unpinned comment is left out rather than snapped to the nearest ancestor:
 * a comment silently attached to the wrong element looks answered, which is
 * worse than one that admits it is lost. The only way back to it is the
 * island's Unpinned filter, which is why that filter exists.
 */

import { kindOf, resolveAnchor } from "@maple-kit/core/anchor";

import type { Comment } from "@maple-kit/core";
import type { AnchorRegion } from "@maple-kit/core/anchor";

/** A comment the page still has somewhere to put. */
export interface Placement {
  readonly comment: Comment;
  /** The address: its place in the branch's own order, counted from one. */
  readonly address: number;
  readonly element: Element;
  /** The passage itself, when a text rung placed it. */
  readonly range?: Range;
  /** The rectangle, when the comment is on a region rather than an element. */
  readonly region?: AnchorRegion;
  readonly confidence: number;
}

/** The address of every comment, which the list and the export share. */
export function addresses(comments: readonly Comment[]): ReadonlyMap<string, number> {
  return new Map(comments.map((comment, index) => [comment.id, index + 1]));
}

/**
 * Everything drawable, in the order it was given, with nothing guessed. A text
 * anchor is narrowed to its passage, so the ring a mark draws highlights the
 * words the comment is on rather than the paragraph they sit in.
 */
export function placements(
  comments: readonly Comment[],
  address: ReadonlyMap<string, number>,
  root: ParentNode,
): readonly Placement[] {
  const placed: Placement[] = [];

  for (const comment of comments) {
    if (comment.status === "orphaned") continue;
    const passage = kindOf(comment.anchor) === "text";
    const found = resolveAnchor(comment.anchor, { root, passage });
    if (found.status !== "resolved") continue;

    placed.push({
      comment,
      address: address.get(comment.id) ?? 0,
      element: found.element,
      ...(found.range === undefined ? {} : { range: found.range }),
      ...(comment.anchor.region === undefined ? {} : { region: comment.anchor.region }),
      confidence: found.confidence,
    });
  }

  return placed;
}
