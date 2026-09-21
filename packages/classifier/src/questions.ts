/**
 * The translation between Maple's vocabulary and jev's.
 *
 * Nothing here reaches a network. A pillar becomes a `score` question, the
 * kind becomes a `choice`, and each answer's own probabilities become the
 * distribution a surface renders. `docs/assist.md` says why a distribution is
 * carried rather than a level.
 */

import {
  COMMENT_KIND_DESCRIPTIONS,
  COMMENT_KINDS,
  FALLBACK_KIND,
} from "@maple-kit/core/connectors";

import type { CommentKind, KindGuess, Pillar, PillarScore } from "@maple-kit/core/connectors";

/** The key the kind question is asked and answered under. */
export const KIND_KEY = "kind";

/** The key one pillar is asked and answered under. */
export function pillarKey(pillar: Pillar): string {
  return `pillar:${pillar.id}`;
}

/** A jev question that picks one option from a described set. */
export interface ChoiceQuestion {
  readonly criteria: Readonly<Record<string, string>>;
  readonly instructions: string;
  readonly type: "choice";
}

/** A jev question that rates against ordered, described levels. */
export interface ScoreQuestion {
  readonly criteria: readonly string[];
  readonly instructions: string;
  readonly type: "score";
}

/** Either, in the shape the System One endpoint takes. */
export type Question = ChoiceQuestion | ScoreQuestion;

/** A jev answer, in the shape the System One endpoint returns. */
export interface Answer {
  readonly type: string;
  readonly choice?: string;
  readonly confidence?: number;
  readonly probabilities?: Readonly<Record<string, number>>;
}

/**
 * Told to every question. Without the first half the model judges the reported
 * problem; without the second it marks a half-typed comment down for being one.
 */
const FRAMING =
  "Judge the review comment in `comment` on how it is written, not on whether what" +
  " it describes is a real problem. It may be half-written; judge what is there.";

/** The `state` one request carries: the comment, and nothing else. */
export function stateFor(body: string): { readonly comment: string } {
  return { comment: body };
}

/**
 * One pillar as a `score` question.
 *
 * The levels arrive already described as concrete situations, which is what
 * the primitive asks for, so the criteria are the pillar's own words.
 */
export function pillarQuestion(pillar: Pillar): ScoreQuestion {
  return {
    type: "score",
    instructions: `${pillar.instruction} ${FRAMING}`,
    criteria: pillar.levels.map((level) => `${level.label}. ${level.description}`),
  };
}

/** The kind as a `choice` question over the fixed vocabulary. */
export function kindQuestion(): ChoiceQuestion {
  return {
    type: "choice",
    instructions:
      "What kind of review comment is `comment`? Judge what its writer is doing" +
      " with it, not how well it is written.",
    criteria: Object.fromEntries(
      COMMENT_KINDS.map((kind) => [kind, COMMENT_KIND_DESCRIPTIONS[kind]]),
    ),
  };
}

/**
 * A `score` answer as a {@link PillarScore}.
 *
 * The probabilities are jev's own, keyed by level index. The level is the
 * rung that took the most of them rather than the weighted mean jev also
 * returns, because a level is an index into a ladder and not a position on it.
 */
export function pillarScoreFrom(pillar: Pillar, answer: Answer): PillarScore {
  const distribution = normalise(
    pillar.levels.map((_, index) => at(answer.probabilities, String(index))),
  );
  const level = argmax(distribution);

  return {
    pillar: pillar.id,
    level,
    distribution,
    confidence: clamp01(answer.confidence ?? concentration(distribution)),
  };
}

/** A `choice` answer as a {@link KindGuess}, over every kind Maple knows. */
export function kindGuessFrom(answer: Answer): KindGuess {
  const shares = normalise(COMMENT_KINDS.map((kind) => at(answer.probabilities, kind)));
  const distribution = {} as Record<CommentKind, number>;
  COMMENT_KINDS.forEach((kind, index) => {
    distribution[kind] = shares[index] ?? 0;
  });

  const chosen = COMMENT_KINDS.find((kind) => kind === answer.choice);
  const kind = chosen ?? COMMENT_KINDS[argmax(shares)] ?? FALLBACK_KIND;
  return { kind, distribution, confidence: clamp01(answer.confidence ?? concentration(shares)) };
}

function at(probabilities: Readonly<Record<string, number>> | undefined, key: string): number {
  const share = probabilities?.[key];
  return typeof share === "number" && Number.isFinite(share) ? Math.max(0, share) : 0;
}

/**
 * Scales shares to sum to one, spreading evenly when they sum to nothing. jev
 * rounds to two places; this corrects that, and the shape stays jev's.
 */
function normalise(shares: readonly number[]): number[] {
  const total = shares.reduce((sum, share) => sum + share, 0);
  if (total <= 0) return shares.map(() => 1 / shares.length);
  return shares.map((share) => share / total);
}

/** How concentrated a distribution is, on the scale jev reports confidence on. */
function concentration(distribution: readonly number[]): number {
  const count = distribution.length;
  if (count < 2) return 1;
  return clamp01((count * Math.max(...distribution) - 1) / (count - 1));
}

/** The first index holding the largest value, so ties go to the earlier rung. */
function argmax(values: readonly number[]): number {
  return values.reduce((best, value, index) => (value > (values[best] ?? 0) ? index : best), 0);
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
