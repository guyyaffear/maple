/**
 * The surface half of the controller's ask-once prompt.
 *
 * The navigation guard knows when a link is about to take an unsent comment
 * away and knows no words. It is a store rather than a hook because the
 * controller is built before React renders: the same object goes to
 * `Maple.Root` as `askToLeave` and to `Maple.Composer` as `leave`.
 */

import type { LeaveAnswer, LeaveQuestion } from "@maple-kit/core/client";

/** The prompt, from both sides: the controller asks, the composer answers. */
export interface LeaveAsk {
  /** Pass to `MapleClientOptions.askToLeave`. Resolves when the reviewer picks. */
  readonly askToLeave: (question: LeaveQuestion) => Promise<LeaveAnswer>;
  /** For `useSyncExternalStore`; returns the unsubscribe. */
  readonly subscribe: (listener: () => void) => () => void;
  /** The question on screen, or undefined when nothing is being asked. */
  readonly pending: () => LeaveQuestion | undefined;
  /** Answers the question on screen. A second call does nothing. */
  readonly answer: (answer: LeaveAnswer) => void;
}

interface Asked {
  readonly question: LeaveQuestion;
  readonly settle: (answer: LeaveAnswer) => void;
}

/**
 * Builds the prompt's store. Nothing here touches the DOM or React, so the
 * copy and the answering are testable without rendering anything.
 */
export function createLeaveAsk(): LeaveAsk {
  const listeners = new Set<() => void>();
  let asked: Asked | undefined;

  const announce = (): void => {
    for (const listener of listeners) listener();
  };

  return {
    askToLeave: (question) => {
      if (asked) return Promise.resolve<LeaveAnswer>("keep");
      return new Promise<LeaveAnswer>((resolve) => {
        asked = { question, settle: resolve };
        announce();
      });
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    pending: () => asked?.question,
    answer: (answer) => {
      const current = asked;
      if (!current) return;
      asked = undefined;
      announce();
      current.settle(answer);
    },
  };
}
