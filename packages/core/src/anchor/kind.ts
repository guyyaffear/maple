/**
 * Which of the three picks made a comment, read back off its anchor.
 *
 * A stored comment does not carry the gesture, and three surfaces used to
 * guess at it separately — the controller, the mark layer and the island —
 * which is two chances to disagree about what a comment is. The anchor knows:
 * a rectangle is a region, a quote is a passage, anything else is its element.
 */

import type { PickKind } from "../types.js";
import type { Anchor } from "./types.js";

/** What the anchor says the pick was. A region outranks the quote it carries. */
export function kindOf(anchor: Anchor): PickKind {
  if (anchor.region !== undefined) return "region";
  return anchor.quote === undefined ? "element" : "text";
}
