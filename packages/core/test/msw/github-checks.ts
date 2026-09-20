/**
 * A fake of the three check-run endpoints the gate uses.
 *
 * A fake rather than fixed responses because the gate reads back what it
 * wrote, and the property under test is what happens on the *second* publish
 * for one commit — which a handler returning a constant cannot express.
 */

import { http, HttpResponse } from "msw";

import type { RequestHandler } from "msw";

const API = "https://api.github.com";

/** One check run, as the fake holds it. */
export interface FakeRun {
  id: number;
  name: string;
  head_sha: string;
  status: string;
  conclusion: string | null;
  external_id: string | null;
  details_url?: string;
  output: { title: string | null; summary: string | null } | null;
}

/** A fake repository's check runs. */
export interface ChecksFake {
  readonly handlers: RequestHandler[];
  /** Every run created on a commit, oldest first. */
  runsOn(sha: string): readonly FakeRun[];
  /** Forgets every run, so one test cannot see another's. */
  reset(): void;
}

/** `filter=all` lists every run; anything else means the most recent one. */
function latestOnly(url: string): boolean {
  return new URL(url).searchParams.get("filter") !== "all";
}

/** Creates the fake. */
export function createChecksFake(owner = "maple-kit", repo = "app"): ChecksFake {
  let runs: FakeRun[] = [];
  let nextId = 500;

  const handlers: RequestHandler[] = [
    http.get(`${API}/repos/${owner}/${repo}/commits/:sha/check-runs`, ({ params, request }) => {
      const name = new URL(request.url).searchParams.get("check_name");
      const matching = runs.filter(
        (run) => run.head_sha === String(params["sha"]) && (name === null || run.name === name),
      );

      const body = latestOnly(request.url) ? matching.slice(-1) : matching;
      return HttpResponse.json({ total_count: body.length, check_runs: body });
    }),

    http.post(`${API}/repos/${owner}/${repo}/check-runs`, async ({ request }) => {
      const sent = (await request.json()) as Partial<FakeRun>;
      nextId += 1;
      const created: FakeRun = {
        id: nextId,
        name: sent.name ?? "",
        head_sha: sent.head_sha ?? "",
        status: sent.status ?? "queued",
        conclusion: sent.conclusion ?? null,
        external_id: sent.external_id ?? null,
        output: sent.output ?? null,
        ...(sent.details_url === undefined ? {} : { details_url: sent.details_url }),
      };

      runs.push(created);
      return HttpResponse.json(created, { status: 201 });
    }),

    http.patch(`${API}/repos/${owner}/${repo}/check-runs/:id`, async ({ params, request }) => {
      const found = runs.find((run) => run.id === Number(params["id"]));
      if (!found) return HttpResponse.json({ message: "Not Found" }, { status: 404 });

      const sent = (await request.json()) as Partial<FakeRun>;
      Object.assign(found, sent, { id: found.id });
      return HttpResponse.json(found);
    }),
  ];

  return {
    handlers,
    runsOn: (sha) => runs.filter((run) => run.head_sha === sha),
    reset: () => {
      runs = [];
      nextId = 500;
    },
  };
}
