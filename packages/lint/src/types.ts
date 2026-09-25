/**
 * What a lint run produces, and the vocabulary every tier reports in.
 *
 * The shape is fixed here rather than per tier because the overlay, the CI
 * check and the SARIF writer all read findings from every tier through one
 * type. A tier that needed its own would make each of those three know which
 * tier it was looking at.
 */

import type { TextQuote } from "@maple-kit/core/anchor";

/** Which tier found it: how much the finding can be trusted to be exact. */
export type Tier = "judged" | "rendered" | "static";

/**
 * How a host is asked to treat it. Deterministic tiers may block; a judged
 * finding defaults to advice, because a model's opinion is not a gate.
 */
export type Severity = "advice" | "error" | "warn";

/**
 * Where on the page the finding is, in the rungs the anchor cascade already
 * understands. A rendered finding has `src` whenever the build ran the tagger,
 * and always has `selector`, which is the rung that never goes missing.
 */
export interface FindingAnchor {
  /** `path/to/file.tsx:line:col`, from `data-maple-src`. */
  readonly src?: string;
  /** CSS selector for the element, the cascade's last rung. */
  readonly selector?: string;
  /** The passage, when the finding is about text rather than a box. */
  readonly quote?: TextQuote;
}

/** One thing a rule found, at one place on the page. */
export interface Finding {
  /** Rule id, `maple/` for a predefined rule. */
  readonly rule: string;
  readonly tier: Tier;
  readonly severity: Severity;
  /** One sentence, in the reviewer's words, naming the value that is wrong. */
  readonly message: string;
  readonly anchor: FindingAnchor;
  /** Where the rule is documented. */
  readonly url?: string;
}
