/**
 * The loop that keeps a judgement beside the field.
 *
 * It sits over the value the composer already debounces into drafts rather
 * than inside that timer: a draft is saved so nothing is lost, and a judgement
 * is asked for so something is shown, and the two want different delays.
 */

import type { AssistAnswer } from "../route/assist.js";
import type { AssistState } from "./types.js";

/** Long enough that a sentence is not judged three times as it is written. */
export const ASSIST_DEBOUNCE_MS = 600;

/** Nothing judges a fragment this short usefully, and every call costs. */
export const ASSIST_MIN_LENGTH = 12;

/** The composer is showing no judgement and has asked for none. */
export const ASSIST_IDLE: AssistState = { status: "idle", scores: [], kind: null };

/** How the runner reaches the route and reports back. */
export interface AssistRunnerOptions {
  judge(body: string, signal: AbortSignal): Promise<AssistAnswer>;
  /** Called on every change. The runner holds no state a surface reads. */
  onChange(state: AssistState): void;
  /** Defaults to {@link ASSIST_DEBOUNCE_MS}. */
  readonly debounceMs?: number;
}

/** The loop. One per controller; a composer close cancels whatever is in flight. */
export interface AssistRunner {
  /** A keystroke. Restarts the timer and abandons whatever was in flight. */
  ask(body: string): void;
  /** Forgets the timer, the request and the last judgement. */
  cancel(): void;
}

/**
 * Builds it.
 *
 * A failure is swallowed on purpose: the field keeps working and the score
 * just does not arrive. `docs/assist.md` states it three ways.
 */
export function createAssistRunner(options: AssistRunnerOptions): AssistRunner {
  const wait = options.debounceMs ?? ASSIST_DEBOUNCE_MS;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let flight: AbortController | undefined;
  let asked = "";

  function stop(): void {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
    flight?.abort();
    flight = undefined;
  }

  async function run(body: string): Promise<void> {
    const controller = new AbortController();
    flight = controller;

    try {
      const answer = await options.judge(body, controller.signal);
      if (!controller.signal.aborted) options.onChange({ status: "ready", ...answer });
    } catch {
      if (!controller.signal.aborted) options.onChange(ASSIST_IDLE);
    } finally {
      if (flight === controller) flight = undefined;
    }
  }

  return {
    ask(body) {
      const next = body.trim();
      if (next === asked) return;
      asked = next;

      stop();
      if (next.length < ASSIST_MIN_LENGTH) {
        options.onChange(ASSIST_IDLE);
        return;
      }

      options.onChange({ status: "judging", scores: [], kind: null });
      timer = setTimeout(() => void run(body), wait);
    },

    cancel() {
      stop();
      asked = "";
      options.onChange(ASSIST_IDLE);
    },
  };
}
