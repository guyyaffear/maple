/**
 * A fake of the one endpoint an App authenticates itself against.
 *
 * A fake rather than a fixed response because the property under test is what
 * happens on the *second* call: a cached token must not mint again, and a
 * counter is the only way to say so.
 */

import { http, HttpResponse } from "msw";

import type { RequestHandler } from "msw";

const API = "https://api.github.com";

/** A fake App installation, and what it was asked. */
export interface AppFake {
  readonly handlers: RequestHandler[];
  /** Forgets every call, so one test cannot see another's. */
  reset(): void;
  /** How many tokens have been minted, which is what a cache is asserted with. */
  mints(): number;
  /** The JWTs presented, newest last, for asserting what was signed. */
  jwts(): readonly string[];
  /** Fails the next mint, so a caller's error path is exercised. */
  failNext(status: number, message: string): void;
  /** What `expires_at` the next token carries. Defaults to an hour out. */
  expiresIn(ms: number): void;
  /** Omits `expires_at` entirely, which GitHub does not but a proxy might. */
  withoutExpiry(): void;
}

const HOUR = 60 * 60 * 1000;

/** Creates the fake. `now` is the test's clock, so expiry is asserted not waited for. */
export function createAppFake(installationId = "7654321", now: () => number = Date.now): AppFake {
  let mints = 0;
  let jwts: string[] = [];
  let failure: { status: number; message: string } | undefined;
  let lifetime: number | undefined = HOUR;

  const handlers: RequestHandler[] = [
    http.post(`${API}/app/installations/${installationId}/access_tokens`, ({ request }) => {
      jwts.push((request.headers.get("authorization") ?? "").replace(/^Bearer /u, ""));

      const failing = failure;
      failure = undefined;
      if (failing) {
        return HttpResponse.json({ message: failing.message }, { status: failing.status });
      }

      mints += 1;
      return HttpResponse.json(
        {
          token: `ghs_installation_${String(mints)}`,
          ...(lifetime === undefined
            ? {}
            : { expires_at: new Date(now() + lifetime).toISOString() }),
        },
        { status: 201 },
      );
    }),
  ];

  return {
    handlers,
    reset(): void {
      mints = 0;
      jwts = [];
      failure = undefined;
      lifetime = HOUR;
    },
    mints: () => mints,
    jwts: () => jwts,
    failNext(status: number, message: string): void {
      failure = { status, message };
    },
    expiresIn(ms: number): void {
      lifetime = ms;
    },
    withoutExpiry(): void {
      lifetime = undefined;
    },
  };
}
