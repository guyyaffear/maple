/**
 * The leaf, drawn. The path data is the marks' and is imported, not copied.
 *
 * It is the island's wordmark, on the pill and in the header. A row's leaf is
 * the comment's own and comes from `MapleLeaf`, which draws all four forms.
 * The relative import is deliberate: reaching it through the package's own
 * exports would count its weight against nothing.
 */

import { createElement, forwardRef } from "react";

import { LEAF_ROTATION, LEAF_SOLID, LEAF_VIEW_BOX } from "../marks/leaf.js";

import type { SVGProps } from "react";

/** Anything an `<svg>` takes, plus the one size the parts vary. */
export interface LeafProps extends Omit<SVGProps<SVGSVGElement>, "ref"> {
  readonly size?: number;
}

/** The filled silhouette, tilted, in `currentColor`. */
export const Leaf = /** @__PURE__ */ forwardRef<SVGSVGElement, LeafProps>(
  function Leaf(props, ref) {
    const { size = 15, ...rest } = props;

    return createElement(
      "svg",
      {
        "aria-hidden": true,
        focusable: false,
        ...rest,
        ref,
        width: size,
        height: size,
        viewBox: LEAF_VIEW_BOX,
      },
      createElement("g", { transform: LEAF_ROTATION }, createElement("path", { d: LEAF_SOLID })),
    );
  },
);
