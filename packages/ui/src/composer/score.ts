/**
 * `Maple.Score`: how the comment being typed reads, and what kind it looks like.
 *
 * It is advice and it is drawn as advice. Nothing here blocks, delays or
 * rewrites a send, and nothing here is presented as more certain than it is:
 * each pillar's bar is the classifier's own distribution across that pillar's
 * rungs, so a judgement that landed between two of them looks like it did.
 * `docs/assist.md` is the design record.
 */

import { COMMENT_KINDS } from "@maple-kit/core/connectors";
import { useMaple, useMapleClient } from "@maple-kit/react";
import { createElement, forwardRef, Fragment } from "react";

import { Slot } from "../slot.js";

import type { AsChildProps } from "../slot.js";
import type { CommentKind, KindGuess, Pillar, PillarScore } from "@maple-kit/core/connectors";
import type { CSSProperties, ReactElement, ReactNode } from "react";

/** The card. It draws nothing at all until something has been judged. */
export interface MapleScoreProps extends AsChildProps {
  readonly className?: string;
  /** The chip that lets a reviewer overrule the guess. On unless asked otherwise. */
  readonly kind?: boolean;
}

/** What the card calls itself, and what the kind control is called. */
export const SCORE_LABEL = "How this comment reads";
export const KIND_LABEL = "What kind of comment this is";

/** The option that hands the kind back to the classifier. */
export const KIND_AUTO = "auto";

/** Below this, a guess is drawn as two kinds rather than as one. */
const UNSURE = 0.5;

/** The card. Renders from `ComposerState` and holds nothing of its own. */
export const MapleScoreCard = /** @__PURE__ */ forwardRef<HTMLElement, MapleScoreProps>(
  function MapleScoreCard(props, ref) {
    const { assist, composer } = useMaple();
    const { scores, status } = composer.assist;
    const Element = (props.asChild ? Slot : "section") as "section";

    if (!assist || status === "idle" || composer.viewing !== undefined) return null;

    return createElement(
      Element,
      {
        ref,
        className: ["mk-composer-row", "mk-score", props.className].filter(Boolean).join(" "),
        "data-mk-status": status,
        "aria-label": SCORE_LABEL,
        "aria-busy": status === "judging",
      },
      props.kind === false ? null : createElement(KindChip),
      ...assist.pillars.map((pillar) => pillarRow(pillar, find(scores, pillar.id))),
    );
  },
);

/**
 * One pillar: its name, its distribution, and the rung that took the most.
 * Three cells of the card's own grid, so every bar lines up without a wrapper.
 */
function pillarRow(pillar: Pillar, score: PillarScore | undefined): ReactNode {
  const level = score?.level;
  const reached = level === undefined ? undefined : pillar.levels[level];

  return createElement(
    Fragment,
    { key: pillar.id },
    createElement("span", { className: "mk-score-name" }, pillar.id),
    createElement(
      "span",
      { className: "mk-score-bar", role: "img", "aria-label": legend(pillar, score) },
      ...pillar.levels.map((_, index) => segment(index, score?.distribution[index])),
    ),
    createElement(
      "span",
      { className: "mk-score-rung", title: reached?.description },
      reached?.label ?? "",
    ),
  );
}

/**
 * One rung, filled by the probability it took. Equal widths keep *which* rung
 * readable; the fill says how sure, so three pale slots are visibly a shrug.
 */
function segment(index: number, share: number | undefined): ReactNode {
  return createElement("i", { key: index, style: { "--mk-p": share ?? 0 } as CSSProperties });
}

/** The sentence a screen reader gets, since it cannot see the segments. */
function legend(pillar: Pillar, score: PillarScore | undefined): string {
  if (score === undefined) return `${pillar.id}: not judged yet`;
  const sure = Math.round(score.confidence * 100);
  return `${pillar.id}: ${pillar.levels[score.level]?.label ?? ""}, ${String(sure)}% confident`;
}

/**
 * The kind, as a control rather than a verdict: the guess is what it starts
 * on and never what it is stuck on.
 */
function KindChip(): ReactElement {
  const { composer } = useMaple();
  const client = useMapleClient();
  const { chosenKind, kind } = composer.assist;

  return createElement(
    "span",
    { className: "mk-kind", "data-mk-chosen": String(chosenKind !== undefined) },
    createElement(
      "span",
      { className: "mk-kind-word", "aria-hidden": "true" },
      word(kind, chosenKind),
    ),
    createElement(
      "select",
      {
        className: "mk-kind-pick",
        "aria-label": KIND_LABEL,
        value: chosenKind ?? KIND_AUTO,
        onChange: (event: { target: { value: string } }) =>
          client.setKind(
            event.target.value === KIND_AUTO ? undefined : (event.target.value as CommentKind),
          ),
      },
      createElement("option", { key: KIND_AUTO, value: KIND_AUTO }, guessed(kind)),
      ...COMMENT_KINDS.map((one) => createElement("option", { key: one, value: one }, one)),
    ),
  );
}

/**
 * What the chip says. An unsure guess names both kinds it was torn between,
 * which says "not sure" without needing a number or a key beside it.
 */
function word(kind: KindGuess | null, chosen: CommentKind | undefined): string {
  if (chosen !== undefined) return chosen;
  if (kind === null) return "…";
  if (kind.confidence >= UNSURE) return kind.kind;

  const runnerUp = COMMENT_KINDS.filter((one) => one !== kind.kind).sort(
    (a, b) => (kind.distribution[b] ?? 0) - (kind.distribution[a] ?? 0),
  )[0];
  return runnerUp === undefined ? kind.kind : `${kind.kind} or ${runnerUp}`;
}

/** What the automatic option is called, once there is something to call it. */
function guessed(kind: KindGuess | null): string {
  return kind === null ? "auto" : `auto (${kind.kind})`;
}

function find(scores: readonly PillarScore[], id: string): PillarScore | undefined {
  return scores.find((score) => score.pillar === id);
}
