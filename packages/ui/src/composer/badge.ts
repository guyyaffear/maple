/**
 * `Maple.Context`: what the page looked like, at the moment of writing.
 *
 * Half of what Maple has and a comment box does not, which is why it is on
 * screen while the comment is written rather than behind a disclosure.
 * `formatContext` renders it from a captured page or a stored comment — one
 * formatter, two inputs, so the two can never drift. Developer detail adds
 * the layout width, the breakpoint, the ratio and the locale to it.
 */

import { formatContext } from "@maple-kit/core/overlay";
import { useMaple } from "@maple-kit/react";
import { createElement, forwardRef } from "react";

import { Slot } from "../slot.js";

import type { AsChildProps } from "../slot.js";
import type { CommentContext } from "@maple-kit/core";
import type { PageContext } from "@maple-kit/core/overlay";
import type { ReactNode } from "react";

/** The badge. The context defaults to the one the pick captured. */
export interface MapleContextProps extends AsChildProps {
  readonly className?: string;
  /** A captured page, or a stored comment's context. Both render identically. */
  readonly context?: CommentContext | PageContext;
}

/** What `formatContext` joins its facts with. */
const SEPARATOR = " · ";

/** So a leading number can carry the emphasis. */
const LEADING_DIGITS = /^\d+/;

/** Every width is tabular: they all change in place. */
export const MapleContextBadge = /** @__PURE__ */ forwardRef<HTMLElement, MapleContextProps>(
  function MapleContextBadge(props, ref) {
    const { composer, detail } = useMaple();
    const context = props.context ?? composer.target?.context;
    const Element = (props.asChild ? Slot : "div") as "div";

    if (!context) return null;

    return createElement(
      Element,
      {
        ref,
        className: props.className
          ? `mk-composer-row mk-ctx ${props.className}`
          : "mk-composer-row mk-ctx",
      },
      ...formatContext(context, detail).split(SEPARATOR).map(fact),
    );
  },
);

/** One fact, its number set apart from the word it measures. */
function fact(text: string, index: number): ReactNode {
  const rest = text.replace(LEADING_DIGITS, "");
  const digits = text.slice(0, text.length - rest.length);
  const body = digits ? [createElement("b", { key: "n" }, digits), rest] : [text];
  const lead = index === 0 ? [] : [SEPARATOR];

  return createElement("span", { key: `${String(index)}-${text}` }, ...lead, ...body);
}
