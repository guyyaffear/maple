/**
 * The name a person would use for the thing a comment is on — "the Yield card".
 *
 * An application says it with `data-maple-label`, on the element or on any
 * ancestor of it, so one attribute on a card names everything inside it. When
 * nothing says it, the component's own name is unpicked into a noun phrase,
 * which is a guess but a recognisable one. An acronym stays an acronym: a
 * reviewer reads "API key card", never "A P I Key card".
 */

import { LABEL_ATTRIBUTE, NAME_ATTRIBUTE } from "../tagger/attributes.js";

import type { Anchor } from "./types.js";

/** Where a label may be read from. Both are optional and either may supply it. */
export interface LabelSource {
  /** The element the comment resolved to, when the page still has one. */
  readonly element?: Element | null;
  /** The anchor the comment recorded, read when there is no element left. */
  readonly anchor?: Pick<Anchor, "component">;
}

/** An acronym, a capitalised or lowercase word, or a run of digits. */
const WORD = /[A-Z]+(?![a-z])|[A-Z]?[a-z\d]+|\d+/g;

const ACRONYM = /^[A-Z\d]{2,}$/;

/**
 * The human name for what a comment is on, or undefined when nothing names it.
 *
 * Nearest label wins, then the anchor's component name, then the component name
 * the page itself carries. A blank attribute counts as unsaid.
 */
export function labelFor(source: LabelSource): string | undefined {
  const { anchor, element } = source;
  const written = element ? closestAttribute(element, LABEL_ATTRIBUTE) : undefined;
  if (written) return written;

  const component =
    anchor?.component ?? (element ? closestAttribute(element, NAME_ATTRIBUTE) : undefined);
  return component ? unpickCamelCase(component) : undefined;
}

/**
 * Unpicks a component name into a noun phrase: `YieldCard` → `Yield card`.
 *
 * Every word after the first is lower-cased so the result reads the way it is
 * said out loud, except an acronym, which is left as it was written.
 */
export function unpickCamelCase(name: string): string {
  const words = name.match(WORD) ?? [];
  return words.map((word, index) => (index === 0 ? leading(word) : trailing(word))).join(" ");
}

function leading(word: string): string {
  if (ACRONYM.test(word)) return word;
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function trailing(word: string): string {
  return ACRONYM.test(word) ? word : word.toLowerCase();
}

function closestAttribute(element: Element, name: string): string | undefined {
  return element.closest(`[${name}]`)?.getAttribute(name)?.trim() || undefined;
}
