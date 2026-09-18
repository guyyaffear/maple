/**
 * The four `setProperty` calls that move something, and nothing else.
 *
 * Position reaches the stylesheet as custom properties rather than as a class
 * or a `cssText` assignment: `setProperty` is the one CSSOM call the overlay's
 * CSP claim allows, and a property carries no transition, so a mark and the
 * ring land where the page is rather than easing towards it a frame later.
 */

import type { Box } from "./geometry.js";

/** Runtime-only, like the reviewer's colour: declared nowhere, set per frame. */
export const X_PROPERTY = "--mk-x";
export const Y_PROPERTY = "--mk-y";
export const W_PROPERTY = "--mk-w";
export const H_PROPERTY = "--mk-h";

/** Set while something is being repositioned, and only then. */
export const MOVING_ATTRIBUTE = "data-mk-moving";

/** Set on anything scrolled far enough off-screen to stop drawing. */
export const OFF_ATTRIBUTE = "data-mk-off";

/** Moves one node. Rounding is the caller's, so a box is measured once. */
export function place(node: ElementCSSInlineStyle, box: Box): void {
  const { style } = node;
  style.setProperty(X_PROPERTY, `${box.x}px`);
  style.setProperty(Y_PROPERTY, `${box.y}px`);
  style.setProperty(W_PROPERTY, `${box.width}px`);
  style.setProperty(H_PROPERTY, `${box.height}px`);
}

/** Writes an attribute only when it would change, so a frame costs nothing. */
export function flag(node: Element, attribute: string, on: boolean): void {
  if (node.hasAttribute(attribute) !== on) node.toggleAttribute(attribute, on);
}
