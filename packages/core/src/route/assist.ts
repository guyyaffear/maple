/**
 * `POST /assist`: the comment being typed, judged.
 *
 * It lives here rather than in the dispatcher because it owns state a
 * dispatcher has no business holding — a cache, so a pause and a retype cost
 * one call, and a limiter, so a stuck client cannot spend a model budget.
 *
 * The provider is reached from here and never from the browser.
 */

import { selectPillars } from "../connectors/classifier.js";
import { fnv1a32 } from "../lib/fnv1a.js";
import { stableStringify } from "../lib/stable-stringify.js";

import type { ClassifierConnector, KindGuess, Pillar, PillarScore } from "../connectors/types.js";
import type { Logger } from "../logger/types.js";

/** How a deployment switches the assist tier on. */
export interface AssistOptions {
  /** The connector. Absent from `RouteOptions`, nothing is scored at all. */
  readonly classifier: ClassifierConnector;
  /** Narrows what is judged to some of the connector's pillars, by id. */
  readonly pillars?: readonly string[];
  /** Judgements kept, keyed by what was judged. Defaults to 200. */
  readonly cacheSize?: number;
  /** Per session, per window. Defaults to 40 calls a minute. */
  readonly rate?: AssistRate;
}

/** A fixed window, counted per session. */
export interface AssistRate {
  readonly limit: number;
  readonly windowMs: number;
}

/** What the endpoint answers with. */
export interface AssistAnswer {
  readonly scores: readonly PillarScore[];
  /** Null when the connector does not classify, not when it was unsure. */
  readonly kind: KindGuess | null;
}

/** The endpoint, built once so its cache and its limiter outlive a request. */
export interface Assist {
  /** What a surface renders labels from. Empty when nothing is scored. */
  readonly pillars: readonly Pillar[];
  respond(request: Request, session: string, logger?: Logger): Promise<Response>;
}

/** Longer than a comment anyone reads, and short enough to stay cheap. */
const MAX_BODY = 4000;

const DEFAULT_CACHE = 200;
const DEFAULT_RATE: AssistRate = { limit: 40, windowMs: 60_000 };

/** Builds the endpoint. Nothing is requested until a comment is judged. */
export function createAssist(options: AssistOptions): Assist {
  const { classifier } = options;
  const pillars = classifier.score ? selectPillars(classifier, options.pillars) : [];
  const cache = createCache(options.cacheSize ?? DEFAULT_CACHE);
  const limiter = createLimiter(options.rate ?? DEFAULT_RATE);

  return {
    pillars,

    async respond(request, session, logger) {
      if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

      const body = await bodyOf(request);
      if (body === undefined) return json({ error: "A body is required" }, 400);
      if (body.length > MAX_BODY) return json({ error: "That is too long to judge" }, 413);
      if (body.trim() === "") return json({ scores: [], kind: null } satisfies AssistAnswer, 200);

      const key = stableStringify({ body, pillars: pillars.map(idOf) });
      const hit = cache.get(key);
      if (hit) return json(hit, 200);

      if (!limiter.take(session)) return json({ error: "Too many judgements" }, 429);

      try {
        const answer = await judge(classifier, body, pillars, request.signal);
        cache.set(key, answer);
        return json(answer, 200);
      } catch (error) {
        logger?.warn("A comment could not be judged.", { error: String(error) });
        return json({ error: "The comment could not be judged" }, 502);
      }
    },
  };
}

/** Both questions at once, so a connector reaching a model makes one round trip. */
async function judge(
  classifier: ClassifierConnector,
  body: string,
  pillars: readonly Pillar[],
  signal: AbortSignal,
): Promise<AssistAnswer> {
  const ask = { body, signal };
  const [scores, kind] = await Promise.all([
    classifier.score?.({ ...ask, pillars: pillars.map(idOf) }) ?? [],
    classifier.classify?.(ask) ?? null,
  ]);

  return { scores, kind };
}

/** The comment to judge, or undefined when the request did not carry one. */
async function bodyOf(request: Request): Promise<string | undefined> {
  try {
    const posted = (await request.json()) as { body?: unknown } | null;
    return typeof posted?.body === "string" ? posted.body : undefined;
  } catch {
    return undefined;
  }
}

function idOf(pillar: Pillar): string {
  return pillar.id;
}

/** What a cache holds: the answer, and what was judged to produce it. */
interface Entry {
  readonly key: string;
  readonly answer: AssistAnswer;
}

/**
 * Keyed by a hash so an entry costs one number, and holding the string it
 * hashed so a collision is a miss rather than another comment's score.
 */
function createCache(size: number): {
  get(key: string): AssistAnswer | undefined;
  set(key: string, answer: AssistAnswer): void;
} {
  const entries = new Map<number, Entry>();

  return {
    get(key) {
      const found = entries.get(fnv1a32(key));
      return found?.key === key ? found.answer : undefined;
    },
    set(key, answer) {
      entries.set(fnv1a32(key), { key, answer });
      evictOldest(entries, size);
    },
  };
}

/** A fixed window per session, so one stuck client cannot spend a budget. */
function createLimiter(rate: AssistRate): { take(session: string): boolean } {
  const windows = new Map<string, { count: number; until: number }>();

  return {
    take(session) {
      const now = Date.now();
      const open = windows.get(session);

      if (!open || open.until <= now) {
        windows.set(session, { count: 1, until: now + rate.windowMs });
        evictOldest(windows, rate.limit * 64);
        return true;
      }

      open.count += 1;
      return open.count <= rate.limit;
    },
  };
}

/** Insertion order is eviction order: neither map is worth an LRU's bookkeeping. */
function evictOldest(
  map: Map<never, never> | Map<number, Entry> | Map<string, unknown>,
  size: number,
): void {
  while (map.size > size) {
    const oldest = map.keys().next();
    if (oldest.done === true) return;
    (map as Map<unknown, unknown>).delete(oldest.value);
  }
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}
