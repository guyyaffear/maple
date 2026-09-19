/**
 * State reaches the stylesheet as `data-*`, never as a prop.
 *
 * A part that took `variant` or `tone` would bake its own look into the
 * library; a part that writes `data-status` leaves the look to whoever owns the
 * stylesheet, which here is one adopted sheet and later may be an application's
 * override. `dataAttributes` is the one place the five names are spelled.
 */

import type { CommentStatus } from "@maple-kit/core";

/**
 * How a mark is drawn: fill says how far through a comment's life it is, so
 * the leaf fills up rather than emptying out. Open is an outline, re-verify
 * is half, resolved is full, and one never written is an outline too — in
 * grey, which is what tells the two apart.
 */
export type PartForm = "outline" | "partial" | "solid";

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
  /** False for a comment still being written, which is drawn in grey. */
  readonly sent?: boolean;
}

/** The rendered attributes, ready to spread. Absent state produces no attribute. */
export type PartAttributes = Readonly<Record<string, string>>;

/** Turns state into the six attributes. The only place their names appear. */
export function dataAttributes(state: PartState): PartAttributes {
  const attributes: Record<string, string> = {};
  if (state.status) attributes["data-status"] = state.status;
  if (state.form) attributes["data-form"] = state.form;
  if (state.confidence) attributes["data-confidence"] = state.confidence;
  if (state.provenance) attributes["data-provenance"] = state.provenance;
  if (state.armed !== undefined) attributes["data-armed"] = String(state.armed);
  if (state.sent !== undefined) attributes["data-sent"] = String(state.sent);
  return attributes;
}

/**
 * What a pointer is doing to a part, rather than what its comment is.
 *
 * These are the overlay's own, so they carry the `mk` prefix the wire states
 * do not: nothing here is recorded, sent, or true of the comment — a mark is
 * peeked because a row is hovered, and nudged because someone moved it.
 */
export interface PointerState {
  /** A row or the mark itself is under a pointer. Sticks to nothing. */
  readonly peeked?: boolean;
  /** Moved off what it was covering, and holding where it was put. */
  readonly nudged?: boolean;
  readonly dragging?: boolean;
}

/** The three attributes, ready to spread. Absent state produces no attribute. */
export function pointerAttributes(state: PointerState): PartAttributes {
  const attributes: Record<string, string> = {};
  if (state.peeked !== undefined) attributes["data-mk-peeked"] = String(state.peeked);
  if (state.nudged !== undefined) attributes["data-mk-nudged"] = String(state.nudged);
  if (state.dragging !== undefined) attributes["data-mk-dragging"] = String(state.dragging);
  return attributes;
}

/**
 * Fill, edge and colour never compete: this decides fill alone. An unsent
 * comment is an outline and so is an unpinned one, which never reached the
 * page; their colour is what separates them from an open comment.
 */
export function formFor(status: CommentStatus | undefined, sent = true): PartForm {
  if (!sent) return "outline";
  if (status === "resolved") return "solid";
  return status === "needs_reverify" ? "partial" : "outline";
}

/** The four confidence words, at the thresholds the tooltips quote. */
export function confidenceFor(value: number): PartConfidence {
  if (value >= 0.95) return "certain";
  if (value >= 0.85) return "strong";
  return value >= 0.65 ? "fair" : "weak";
}
