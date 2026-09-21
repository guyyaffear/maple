import { COMMENT_KINDS, DEFAULT_PILLARS } from "@maple-kit/core/connectors";
import { describe, expect, it } from "vitest";

import { kindGuessFrom, kindQuestion, pillarQuestion, pillarScoreFrom } from "../src/questions.js";

import type { Pillar } from "@maple-kit/core/connectors";

const SPECIFIC = DEFAULT_PILLARS[0] as Pillar;

describe("pillarQuestion", () => {
  it("keeps the pillar's own words and one criterion per rung", () => {
    const question = pillarQuestion(SPECIFIC);

    expect(question.type).toBe("score");
    expect(question.instructions).toContain(SPECIFIC.instruction);
    expect(question.criteria).toHaveLength(SPECIFIC.levels.length);
    expect(question.criteria[0]).toContain(SPECIFIC.levels[0]?.label);
  });

  it("says to judge the writing, and to judge a half-typed comment as it stands", () => {
    const { instructions } = pillarQuestion(SPECIFIC);

    expect(instructions).toContain("not on whether what it describes is a real problem");
    expect(instructions).toContain("half-written");
  });
});

describe("kindQuestion", () => {
  it("offers every kind Maple recognises, described", () => {
    const question = kindQuestion();

    expect(question.type).toBe("choice");
    expect(Object.keys(question.criteria)).toEqual([...COMMENT_KINDS]);
    for (const text of Object.values(question.criteria)) {
      expect(text.length).toBeGreaterThan(20);
    }
  });
});

describe("pillarScoreFrom", () => {
  it("takes the rung that took the most probability, not the weighted mean", () => {
    const score = pillarScoreFrom(SPECIFIC, {
      confidence: 0.5,
      probabilities: { "0": 0.45, "1": 0.1, "2": 0.45 },
      type: "score",
    });

    expect(score.level).toBe(0);
    expect(score.distribution).toEqual([0.45, 0.1, 0.45]);
  });

  it("corrects jev's two-place rounding so the distribution still sums to one", () => {
    const score = pillarScoreFrom(SPECIFIC, {
      confidence: 0.1,
      probabilities: { "0": 0.33, "1": 0.33, "2": 0.33 },
      type: "score",
    });

    expect(score.distribution.reduce((sum, share) => sum + share, 0)).toBeCloseTo(1, 10);
  });

  it("measures its own confidence when the provider reported none", () => {
    const certain = pillarScoreFrom(SPECIFIC, {
      probabilities: { "0": 0, "1": 0, "2": 1 },
      type: "score",
    });
    const undecided = pillarScoreFrom(SPECIFIC, {
      probabilities: { "0": 0.34, "1": 0.33, "2": 0.33 },
      type: "score",
    });

    expect(certain.confidence).toBe(1);
    expect(undecided.confidence).toBeLessThan(0.05);
  });

  it("answers a level the provider left out with no probability, not with a hole", () => {
    const score = pillarScoreFrom(SPECIFIC, {
      confidence: 0.9,
      probabilities: { "0": 1 },
      type: "score",
    });

    expect(score.distribution).toEqual([1, 0, 0]);
  });

  it("spreads evenly rather than dividing by nothing when every share is zero", () => {
    const score = pillarScoreFrom(SPECIFIC, { probabilities: {}, type: "score" });

    expect(score.distribution).toEqual([1 / 3, 1 / 3, 1 / 3]);
  });
});

describe("kindGuessFrom", () => {
  it("keeps the kind jev chose, with a share for every other one", () => {
    const guess = kindGuessFrom({
      choice: "praise",
      confidence: 0.98,
      probabilities: { bug: 0.01, copy: 0, other: 0, praise: 0.99, question: 0, request: 0 },
      type: "choice",
    });

    expect(guess.kind).toBe("praise");
    expect(guess.confidence).toBeCloseTo(0.98, 10);
    expect(Object.keys(guess.distribution)).toEqual(expect.arrayContaining([...COMMENT_KINDS]));
  });

  it("falls back to the likeliest kind when the provider named one nobody offered", () => {
    const guess = kindGuessFrom({
      choice: "feature-request",
      confidence: 0.6,
      probabilities: { bug: 0.1, copy: 0, other: 0, praise: 0, question: 0, request: 0.9 },
      type: "choice",
    });

    expect(guess.kind).toBe("request");
  });
});
