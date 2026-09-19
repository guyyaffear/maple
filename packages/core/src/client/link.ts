/**
 * Linking a reviewer's GitHub account, from the overlay's side of the route.
 *
 * The waiting happens here rather than in a held-open request: a person takes
 * minutes to read a code, reach github.com and type it. Everything secret —
 * the device code, the token — stays on the route, in cookies this side never
 * sees. What this file holds is a short string to show and a timer.
 */

import type { Transport } from "./transport.js";
import type { GitHubLink } from "./types.js";

/** What the poller needs, so a test can drive it without waiting. */
export interface LinkOptions {
  readonly transport: Transport;
  /** Called with each new state, in the order they happen. */
  readonly onChange: (link: GitHubLink) => void;
  /** Defaults to `setTimeout`. Injected so a test does not really wait. */
  readonly sleep?: (ms: number) => Promise<void>;
  /** Milliseconds since the epoch. Injected so expiry is testable. */
  readonly now?: () => number;
}

/** A link in progress, which the controller cancels when it is destroyed. */
export interface LinkRun {
  /** Stops polling and reports nothing further. */
  cancel(): void;
}

const SECOND = 1000;

/**
 * Starts a link and polls until it resolves. Returns as soon as there is a
 * code to show, so the surface renders it while the polling carries on.
 */
export async function startLink(options: LinkOptions): Promise<LinkRun> {
  const started = await options.transport.linkStart();

  options.onChange({
    state: "linking",
    userCode: started.userCode,
    verificationUri: started.verificationUri,
    expiresAt: started.expiresAt,
  });

  let cancelled = false;
  void poll(options, started, () => cancelled);
  return {
    cancel: () => {
      cancelled = true;
    },
  };
}

interface Started {
  readonly expiresAt: number;
  readonly interval: number;
}

async function poll(
  options: LinkOptions,
  started: Started,
  cancelled: () => boolean,
): Promise<void> {
  const wait = options.sleep ?? ((ms: number) => new Promise((done) => setTimeout(done, ms)));
  const now = options.now ?? Date.now;
  let interval = started.interval;

  while (!cancelled()) {
    if (now() >= started.expiresAt) {
      options.onChange({ state: "failed", reason: "expired" });
      return;
    }

    await wait(interval * SECOND);
    if (cancelled()) return;

    const next = await attempt(options.transport);
    if (next.done) {
      if (!cancelled()) options.onChange(next.link);
      return;
    }
    interval = next.interval;
  }
}

type Step =
  | { readonly done: true; readonly link: GitHubLink }
  | { readonly done: false; readonly interval: number };

/**
 * A failure carries the route's own words. "The code expired" is a sentence a
 * surface can show; a bare status number is not.
 */
async function attempt(transport: Transport): Promise<Step> {
  try {
    const result = await transport.linkAttempt();
    if (result.status === "pending") return { done: false, interval: result.interval };

    const login = result.login === undefined ? {} : { login: result.login };
    return { done: true, link: { state: "linked", ...login } };
  } catch (error) {
    return { done: true, link: { state: "failed", reason: reasonOf(error) } };
  }
}

function reasonOf(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.length === 0 ? "unknown" : message;
}
