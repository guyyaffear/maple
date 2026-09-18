/**
 * A chip that carries a number, and a tooltip that carries the sentence.
 *
 * A row of comments is scanned rather than read, and a sentence in a scanned
 * row is skipped along with everything beside it — so every technical fact on
 * this surface puts the number on the chip and the explanation one hover
 * away. It is CSS rather than state: a tooltip that re-renders the island to
 * appear re-runs the card's entrance, which already read as a flicker once.
 */

import { createElement, forwardRef, useId } from "react";

import { cx } from "./part.js";

import type { ReactNode } from "react";

/** A chip, its sentence, and whatever the chip is drawn as. */
export interface TipProps {
  /** The sentence. Never rendered in the row itself. */
  readonly sentence: string;
  /** What the chip shows: a number, a percentage, a path. */
  readonly children?: ReactNode;
  readonly className?: string;
}

/**
 * Reachable by keyboard as well as by pointer, because a fact only a mouse
 * can read is a fact half the reviewers do not have.
 */
export const Tip = /** @__PURE__ */ forwardRef<HTMLSpanElement, TipProps>(function Tip(props, ref) {
  const id = useId();

  return createElement(
    "span",
    {
      className: cx("mk-chip mk-tipped", props.className),
      tabIndex: 0,
      "aria-describedby": id,
      ref,
    },
    props.children,
    createElement("span", { className: "mk-tip", role: "tooltip", id }, props.sentence),
  );
});
