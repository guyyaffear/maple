import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ASSIST_IDLE, ASSIST_MIN_LENGTH, createAssistRunner } from "../src/client/assist.js";

import type { AssistState } from "../src/client/types.js";
import type { AssistAnswer } from "../src/route/assist.js";

const WRITTEN = "The Save button's label is cut off at 320px.";
const ANSWER: AssistAnswer = {
  scores: [{ pillar: "concise", level: 2, distribution: [0, 0, 1], confidence: 1 }],
  kind: {
    kind: "bug",
    distribution: { bug: 1, copy: 0, other: 0, praise: 0, question: 0, request: 0 },
    confidence: 1,
  },
};

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

/** A runner over a judge that records what it was asked and can be held open. */
function runner(judge?: (body: string, signal: AbortSignal) => Promise<AssistAnswer>) {
  const states: AssistState[] = [];
  const asked: string[] = [];
  const aborted: string[] = [];

  const run = createAssistRunner({
    debounceMs: 100,
    judge: (body, signal) => {
      asked.push(body);
      signal.addEventListener("abort", () => aborted.push(body));
      return judge?.(body, signal) ?? Promise.resolve(ANSWER);
    },
    onChange: (state) => states.push(state),
  });

  return { aborted, asked, run, states };
}

describe("the assist loop", () => {
  it("judges once for a burst of keystrokes", async () => {
    const { asked, run } = runner();

    for (const body of [WRITTEN.slice(0, 20), WRITTEN.slice(0, 30), WRITTEN]) run.ask(body);
    await vi.advanceTimersByTimeAsync(100);

    expect(asked).toEqual([WRITTEN]);
  });

  it("says it is judging before it has judged", () => {
    const { run, states } = runner();
    run.ask(WRITTEN);

    expect(states.at(-1)).toEqual({ status: "judging", scores: [], kind: null });
  });

  it("asks nothing at all about a fragment too short to judge", async () => {
    const { asked, run, states } = runner();
    run.ask("x".repeat(ASSIST_MIN_LENGTH - 1));
    await vi.advanceTimersByTimeAsync(200);

    expect(asked).toEqual([]);
    expect(states.at(-1)).toEqual(ASSIST_IDLE);
  });

  it("does not re-judge a body it has already asked about", async () => {
    const { asked, run } = runner();

    run.ask(WRITTEN);
    await vi.advanceTimersByTimeAsync(100);
    run.ask(`${WRITTEN} `);
    await vi.advanceTimersByTimeAsync(100);

    expect(asked).toEqual([WRITTEN]);
  });

  it("abandons a judgement in flight when the next keystroke lands", async () => {
    const { aborted, asked, run } = runner(() => new Promise(() => undefined));

    run.ask(WRITTEN);
    await vi.advanceTimersByTimeAsync(100);
    run.ask(`${WRITTEN} And another thing.`);
    await vi.advanceTimersByTimeAsync(100);

    expect(aborted).toEqual([WRITTEN]);
    expect(asked).toHaveLength(2);
  });

  it("never lands an answer the reviewer has already typed past", async () => {
    const { run, states } = runner((body) =>
      body === WRITTEN
        ? new Promise((resolve) => setTimeout(() => resolve(ANSWER), 500))
        : Promise.resolve(ANSWER),
    );

    run.ask(WRITTEN);
    await vi.advanceTimersByTimeAsync(100);
    run.ask(`${WRITTEN} And another thing.`);
    await vi.advanceTimersByTimeAsync(600);

    expect(states.filter((state) => state.status === "ready")).toHaveLength(1);
  });

  it("swallows a failure: the field keeps working, the score does not arrive", async () => {
    const { run, states } = runner(() => Promise.reject(new Error("502")));

    run.ask(WRITTEN);
    await vi.advanceTimersByTimeAsync(100);

    expect(states.at(-1)).toEqual(ASSIST_IDLE);
  });

  it("forgets everything when it is cancelled", async () => {
    const { asked, run, states } = runner();

    run.ask(WRITTEN);
    run.cancel();
    await vi.advanceTimersByTimeAsync(200);

    expect(asked).toEqual([]);
    expect(states.at(-1)).toEqual(ASSIST_IDLE);
  });

  it("judges again after a cancel, even for the same body", async () => {
    const { asked, run } = runner();

    run.ask(WRITTEN);
    await vi.advanceTimersByTimeAsync(100);
    run.cancel();
    run.ask(WRITTEN);
    await vi.advanceTimersByTimeAsync(100);

    expect(asked).toEqual([WRITTEN, WRITTEN]);
  });
});
