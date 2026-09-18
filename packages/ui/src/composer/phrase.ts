/**
 * What the composer calls the thing a comment is about, in plain language.
 *
 * `labelFor` in `@maple-kit/core/anchor` is the one naming rule and is never
 * re-derived here; this turns the name it gives into the sentence a reviewer
 * reads, and names what is at stake when a link is about to take an unsent
 * comment away.
 */

import { labelFor } from "@maple-kit/core/anchor";

import type { ComposerTarget, PickKind } from "@maple-kit/core/client";
import type { LeaveSubject } from "@maple-kit/core/client";

/** The word on the kind chip: a text pick is a passage to everyone but the code. */
export const KIND_WORDS: Readonly<Record<PickKind, string>> = {
  element: "element",
  region: "region",
  text: "passage",
};

/** What a pick is called when nothing on the page names it. */
export const UNNAMED_TARGET = "this page";

/** The preposition the phrase is rendered behind. */
export const TARGET_PREFIX = "on ";

/** The label the controller resolved, the one `labelFor` reads, or the page. */
export function targetName(target: ComposerTarget): string {
  return target.label ?? labelFor({ anchor: target.anchor }) ?? UNNAMED_TARGET;
}

/** After "on": an element is its own name; a passage and a region are held. */
export function targetPhrase(kind: PickKind, name: string): string {
  if (kind === "text") return `a passage in ${name}`;
  return kind === "region" ? `an area of ${name}` : name;
}

/** What is about to be lost, named. "Are you sure?" answers nothing. */
export function leaveMessage(subject: LeaveSubject): string {
  return `You have an unsent comment on ${subject.label ?? UNNAMED_TARGET}.`;
}

/** The safe answer, and the one focused when the prompt opens. */
export const LEAVE_KEEP = "Keep writing";

/** The only way a draft is thrown away on the way out. */
export const LEAVE_DISCARD = "Discard";
