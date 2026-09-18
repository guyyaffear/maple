/**
 * State reaches the stylesheet as `data-*`, never as a prop.
 *
 * A part that took `variant` or `tone` would bake its own look into the
 * library; a part that writes `data-status` leaves the look to whoever owns the
 * stylesheet, which here is one adopted sheet and later may be an application's
 * override. `dataAttributes` is the one place the five names are spelled.
 */

import type { CommentStatus } from "@maple-kit/core";

/** How a mark is drawn: fill says how far through its life a comment is. */
export type PartForm = "dashed" | "partial" | "ring" | "solid";

/** The confidence word a reviewer reads, and what the low fill keys off. */
export type PartConfidence = "certain" | "fair" | "strong" | "weak";

/** How sure Maple is that this author is who the comment says. */
export type PartProvenance = "client" | "guest" | "server";

/** Everything a part may say about itself. Every field is optional. */
export interface PartState {
  readonly status?: CommentStatus;
  readonly form?: PartForm;
  readonly confidence?: PartConfidence;
  readonly provenance?: PartProvenance;
  readonly armed?: boolean;
}

/** The rendered attributes, ready to spread. Absent state produces no attribute. */
export type PartAttributes = Readonly<Record<string, string>>;

/** Turns state into the five attributes. The only place their names appear. */
export function dataAttributes(state: PartState): PartAttributes {
  const attributes: Record<string, string> = {};
  if (state.status) attributes["data-status"] = state.status;
  if (state.form) attributes["data-form"] = state.form;
  if (state.confidence) attributes["data-confidence"] = state.confidence;
  if (state.provenance) attributes["data-provenance"] = state.provenance;
  if (state.armed !== undefined) attributes["data-armed"] = String(state.armed);
  return attributes;
}

/**
 * Fill, edge and colour never compete: this decides fill alone. An unsent
 * comment is dashed and so is an unpinned one, which never reaches the page.
 */
export function formFor(status: CommentStatus | undefined, sent = true): PartForm {
  if (!sent) return "dashed";
  if (status === "resolved") return "ring";
  if (status === "needs_reverify") return "partial";
  return status === "orphaned" ? "dashed" : "solid";
}

/** The four confidence words, at the thresholds the tooltips quote. */
export function confidenceFor(value: number): PartConfidence {
  if (value >= 0.95) return "certain";
  if (value >= 0.85) return "strong";
  return value >= 0.65 ? "fair" : "weak";
}
