/**
 * `Maple.Filters`: four pills and the tab for the ones with no place left.
 *
 * Unpinned is a tab rather than an empty state: about a quarter of anchors lose
 * their place over time, so it is the expected case and deserves somewhere to
 * be rather than a filter that usually finds nothing. Selecting one swaps the
 * rows and leaves the card alone.
 */

import { useMaple, useMapleClient } from "@maple-kit/react";
import { forwardRef } from "react";

import { countsFor } from "./comments.js";
import { listId, useIsland } from "./context.js";
import { FILTER_LABELS, FILTER_ORDER } from "./language.js";
import { cx, renderPart } from "./part.js";

import type { PartProps } from "./part.js";
import type { CommentFilter } from "@maple-kit/core/client";
import type { ReactNode } from "react";

/** The filter row. Its own children replace the pills. */
export interface FiltersProps extends PartProps {
  readonly children?: ReactNode;
}

const PART = "<Maple.Filters>";

/** Every filter with its live count, and the unpinned tab at the end. */
export const Filters = /** @__PURE__ */ forwardRef<HTMLDivElement, FiltersProps>(
  function Filters(props, ref) {
    const { asChild, children, className, ...rest } = props;
    const island = useIsland(PART);
    const { comments, filter, showResolved } = useMaple();
    const client = useMapleClient();

    const counts = countsFor(comments, showResolved);
    const pill = (name: CommentFilter) =>
      renderPart(
        "button",
        false,
        {
          key: name,
          type: "button",
          role: "tab",
          "aria-controls": listId(island.contentId),
          "aria-selected": filter === name,
          className: cx("mk-filter", name === "unpinned" && "mk-tab"),
          onClick: () => client.setFilter(name),
        },
        [
          FILTER_LABELS[name],
          renderPart("span", false, { key: "n", className: "mk-count" }, String(counts[name])),
        ],
      );

    return renderPart(
      "div",
      asChild,
      { role: "tablist", ...rest, className: cx("mk-filters", className), ref },
      children ?? [...FILTER_ORDER.map(pill), pill("unpinned")],
    );
  },
);
