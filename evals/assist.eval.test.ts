/**
 * Does judging a comment with a model beat judging it with a word list?
 *
 * The baseline runs on every CI run, because it needs no credential and it is
 * the floor: a model that cannot beat a word list is not worth its latency.
 * The model tier runs beside it whenever a credential is in the environment,
 * and it is measured against the baseline's own score as well as its own
 * threshold — README.md says why a threshold is never lowered.
 */

import { readFileSync } from "node:fs";

import { jevClassifier } from "@maple-kit/classifier";
import { keywordClassifier } from "@maple-kit/core/connectors";
import { describe, expect, it } from "vitest";

import type { ClassifierConnector } from "@maple-kit/core/connectors";

/** One comment, and the answers a reader agreed on. */
interface Case {
  readonly id: string;
  readonly by: "maintainer" | "reviewer";
  readonly body: string;
  readonly kind: string;
  /** Only the rungs that are not arguable. A scorer scores what is here. */
  readonly pillars: Readonly<Record<string, number>>;
}

const CASES: readonly Case[] = JSON.parse(
  readFileSync(new URL("./cases/assist/comments.json", import.meta.url), "utf8"),
) as Case[];

/**
 * Measured, not chosen: the baseline scored 40.0/60.4 and jev 73.3/89.9 when
 * this set landed, and each sits just under its tier's own number.
 */
const THRESHOLDS = {
  baseline: { kind: 0.35, pillars: 0.55 },
  model: { kind: 0.65, pillars: 0.82 },
};

const ids = process.env["EVAL_IDS"]?.split(",").map((id) => id.trim());
const chosen = ids === undefined ? CASES : CASES.filter((one) => ids.includes(one.id));
const samples = Math.max(1, Number(process.env["EVAL_SAMPLES"] ?? "1"));

/** A tier's score over the whole set, per scorer. */
interface Report {
  readonly kind: number;
  readonly pillars: number;
}

/** The kind is right or it is not; a pillar scores the labelled rungs it hit. */
async function score(connector: ClassifierConnector): Promise<Report> {
  const runs = Array.from({ length: samples }, () => chosen).flat();
  const results = await Promise.all(runs.map((one) => judge(connector, one)));

  return {
    kind: mean(results.map((result) => result.kind)),
    pillars: mean(results.filter((result) => result.pillars !== undefined).map(pillarsOf)),
  };
}

async function judge(connector: ClassifierConnector, one: Case): Promise<Scored> {
  const [scores, guess] = await Promise.all([
    connector.score?.({ body: one.body }) ?? [],
    connector.classify?.({ body: one.body }) ?? null,
  ]);

  const levels = new Map(scores.map((each) => [each.pillar, each.level]));
  const labelled = Object.entries(one.pillars);
  const right = labelled.filter(([pillar, level]) => levels.get(pillar) === level);

  return {
    kind: guess?.kind === one.kind ? 1 : 0,
    ...(labelled.length === 0 ? {} : { pillars: right.length / labelled.length }),
  };
}

interface Scored {
  readonly kind: number;
  readonly pillars?: number;
}

function pillarsOf(result: Scored): number {
  return result.pillars ?? 0;
}

function mean(values: readonly number[]): number {
  return values.length === 0 ? 1 : values.reduce((sum, value) => sum + value, 0) / values.length;
}

const apiKey = process.env["TYPESAFE_API_KEY"] ?? "";

describe("assist · the keyword baseline", () => {
  it(`is the floor every model has to clear (${String(chosen.length)} cases)`, async () => {
    const report = await score(keywordClassifier());

    expect(report.kind).toBeGreaterThanOrEqual(THRESHOLDS.baseline.kind);
    expect(report.pillars).toBeGreaterThanOrEqual(THRESHOLDS.baseline.pillars);
  });
});

/**
 * Skipped rather than failed without a credential: CI has none, and a suite
 * that goes red because nobody gave it a key teaches people to ignore it.
 */
describe.skipIf(apiKey === "")("assist · the model tier", () => {
  it("clears its own threshold, and beats the word list on both scorers", async () => {
    const model = process.env["MAPLE_AI_MODEL"];
    const jev = jevClassifier({ apiKey, ...(model === undefined ? {} : { model }) });

    const [tier, floor] = await Promise.all([score(jev), score(keywordClassifier())]);

    expect(tier.kind).toBeGreaterThanOrEqual(THRESHOLDS.model.kind);
    expect(tier.pillars).toBeGreaterThanOrEqual(THRESHOLDS.model.pillars);
    expect(tier.kind).toBeGreaterThan(floor.kind);
    expect(tier.pillars).toBeGreaterThan(floor.pillars);
  }, 180_000);
});
