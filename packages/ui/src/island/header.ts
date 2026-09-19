/**
 * The island's top edge: what this is, which branch, and the way out.
 *
 * The close control belongs to the header rather than to the composition, so
 * every island has one and no application composes itself into a card it
 * cannot shut. Settings sit behind the control beside it, not in a visible row.
 */

import { forwardRef } from "react";

import { useIsland } from "./context.js";
import { ISLAND_COPY } from "./language.js";
import { Leaf } from "./leaf.js";
import { cx, renderPart } from "./part.js";

import type { PartProps } from "./part.js";
import type { ReactNode } from "react";

/** The header row. Its children sit before the close control. */
export interface HeaderProps extends PartProps {
  readonly children?: ReactNode;
}

/** The wordmark, and the word. */
export interface LogoProps extends PartProps {
  /** Replaces the title beside the leaf. */
  readonly children?: ReactNode;
}

/** Which branch these comments belong to. */
export interface BranchProps extends PartProps {
  /** The branch the island is pointed at, as the chip should read it. */
  readonly branch?: string;
  /** Shown instead of the branch, which stays on the chip as its title. */
  readonly label?: string;
  readonly children?: ReactNode;
}

const HEADER_PART = "<Maple.Header>";

/** The header, with the close control after whatever it was given. */
export const Header = /** @__PURE__ */ forwardRef<HTMLDivElement, HeaderProps>(
  function Header(props, ref) {
    const { asChild, children, className, ...rest } = props;
    const island = useIsland(HEADER_PART);

    return renderPart("div", asChild, { ...rest, className: cx("mk-head", className), ref }, [
      children,
      renderPart(
        "button",
        false,
        {
          key: "close",
          type: "button",
          "aria-label": ISLAND_COPY.close,
          className: "mk-iconbtn mk-hit",
          onClick: () => island.setOpen(false),
        },
        ISLAND_COPY.closeGlyph,
      ),
    ]);
  },
);

/** The leaf and the word "Comments", which is what the island is. */
export const Logo = /** @__PURE__ */ forwardRef<HTMLHeadingElement, LogoProps>(
  function Logo(props, ref) {
    const { asChild, children, className, ...rest } = props;

    return renderPart("h2", asChild, { ...rest, className: cx("mk-head-title", className), ref }, [
      renderPart(Leaf, false, { key: "leaf", size: 17, className: "mk-logo-leaf" }),
      children ?? ISLAND_COPY.title,
    ]);
  },
);

/**
 * The branch chip. It takes the branch rather than reading it, because the
 * controller keeps what it was pointed at and does not publish it back. A
 * label reads in its place when there is one; the branch stays as the title,
 * because a label is lossy and the exact name is what a person copies.
 */
export const Branch = /** @__PURE__ */ forwardRef<HTMLSpanElement, BranchProps>(
  function Branch(props, ref) {
    const { asChild, branch, children, className, label, ...rest } = props;
    const shown = children ?? label ?? branch;
    if (shown === undefined) return null;

    return renderPart(
      "span",
      asChild,
      { ...rest, className: cx("mk-branch", className), title: branch, ref },
      shown,
    );
  },
);
