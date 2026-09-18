/**
 * Shared handlers, one export per upstream.
 *
 * Nothing here yet: Maple makes no network calls. The first connector adds its
 * upstream's handlers as `github.ts`, `datadog.ts` and so on, and re-exports
 * them from here so a suite can pull in a whole upstream at once.
 */

import type { RequestHandler } from "msw";

/** Handlers loaded by default. Suites add their own on top. */
export const handlers: RequestHandler[] = [];
