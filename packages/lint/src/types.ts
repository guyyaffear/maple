/**
 * What a lint run produces, and the vocabulary every tier reports in.
 *
 * The shape is fixed here rather than per tier because the overlay, the CI
 * check and the SARIF writer all read findings from every tier through one
 * type. A tier that needed its own would make each of those three know which
 * tier it was looking at.
 */

import type { Anchor } from "@maple-kit/core/anchor";

/** Which tier found it: how much the finding can be trusted to be exact. */
export type Tier = "judged" | "rendered" | "static";

/**
 * How a host is asked to treat it. Deterministic tiers may block; a judged
 * finding defaults to advice, because a model's opinion is not a gate.
 */
export type Severity = "advice" | "error" | "warn";

/** One thing a rule found, at one place on the page. */
export interface Finding {
  /** Rule id, `maple/` for a predefined rule. */
  readonly rule: string;
  readonly tier: Tier;
  readonly severity: Severity;
  /** One sentence, in the reviewer's words, naming the value that is wrong. */
  readonly message: string;
  /**
   * Where it is, in the cascade's own type. A finding and a comment mean the
   * same thing by "where", which is what lets one be pinned beside the other.
   */
  readonly anchor: Anchor;
  /** Where the rule is documented. */
  readonly url?: string;
}
