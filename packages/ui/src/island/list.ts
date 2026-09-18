/**
 * `Maple.List`: the rows under whatever filter is on.
 *
 * The rows are what a filter swaps; the card around them is not rebuilt. Under
 * the unpinned tab they are ordered by the reason they lost their place, which
 * is the thing worth grouping by once losing one is the expected case.
 */

import { useComments, useMaple } from "@maple-kit/react";
import { createElement, forwardRef, Fragment } from "react";

import { byReason } from "./comments.js";
import { listId, useIsland } from "./context.js";
import { FILTER_LABELS, ISLAND_COPY } from "./language.js";
import { cx, renderPart } from "./part.js";

import type { PartProps } from "./part.js";
import type { Comment } from "@maple-kit/core";
import type { ReactNode } from "react";

/** The list, and how one comment is rendered into a row. */
export interface ListProps extends PartProps {
  /** Called for each comment the filter shows, in render order. */
  readonly children?: (comment: Comment) => ReactNode;
}

const PART = "<Maple.List>";

/** Every comment under the current filter, or the one line that says there are none. */
export const List = /** @__PURE__ */ forwardRef<HTMLDivElement, ListProps>(
  function List(props, ref) {
    const { asChild, children, className, ...rest } = props;
    const island = useIsland(PART);
    const { filter } = useMaple();
    const comments = useComments();

    const rows =
      filter === "unpinned"
        ? byReason(comments, (comment) => island.orphans.get(comment.id))
        : comments;
    const body =
      rows.length === 0
        ? renderPart("p", false, { className: "mk-empty" }, ISLAND_COPY.empty)
        : rows.map((comment) => createElement(Fragment, { key: comment.id }, children?.(comment)));

    return renderPart(
      "div",
      asChild,
      {
        role: "tabpanel",
        ...rest,
        id: listId(island.contentId),
        "aria-label": FILTER_LABELS[filter],
        className: cx("mk-list", className),
        ref,
      },
      body,
    );
  },
);
