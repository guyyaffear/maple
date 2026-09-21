import { http, HttpResponse } from "msw";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { CHECK_NAME, githubGate } from "../src/connectors/github-gate.js";
import { decideGate } from "../src/gate/decide.js";
import { storedComment } from "../src/testing/fixtures.js";
import { ACTIONS_APP, createChecksFake, MAPLE_APP } from "./msw/github-checks.js";
import { createTestServer, useTestServer } from "./msw/server.js";

const API = "https://api.github.com";
const checks = createChecksFake();
const server = createTestServer(...checks.handlers);

useTestServer(server, { beforeAll, afterEach, afterAll });
afterEach(() => checks.reset());

const SHA = "0f1e2d3c4b5a69788796a5b4c3d2e1f00f1e2d3c";
const at = { branch: "feature/gate", sha: SHA };
const blocked = decideGate([storedComment({ status: "open" })]);
const clear = decideGate([storedComment({ status: "resolved" })]);
const unknown = decideGate(undefined);

function gate() {
  return githubGate({ owner: "maple-kit", repo: "app", token: "gate-token" });
}

describe("how a verdict becomes a check run", () => {
  it("holds a blocked commit at in_progress rather than failing it", async () => {
    await gate().publish({ ...at, verdict: blocked });

    const [run] = checks.runsOn(SHA);
    expect(run).toMatchObject({ name: CHECK_NAME, status: "in_progress", conclusion: null });
  });

  it("passes a clear commit as success", async () => {
    await gate().publish({ ...at, verdict: clear });
    expect(checks.runsOn(SHA)[0]).toMatchObject({ status: "completed", conclusion: "success" });
  });

  it("reports neutral where it cannot tell, so the required check still reports", async () => {
    await gate().publish({ ...at, verdict: unknown });
    expect(checks.runsOn(SHA)[0]).toMatchObject({ status: "completed", conclusion: "neutral" });
  });

  it("puts the verdict's own words in the output", async () => {
    await gate().publish({ ...at, verdict: blocked });

    const output = checks.runsOn(SHA)[0]?.output;
    expect(output?.title).toBe(blocked.title);
    expect(output?.summary).toContain("These comments are still open");
  });

  it("links the preview when it is given one", async () => {
    await gate().publish({ ...at, verdict: blocked, reviewUrl: "https://preview.test/?maple=on" });
    expect(checks.runsOn(SHA)[0]?.details_url).toBe("https://preview.test/?maple=on");
  });

  it("takes the check name it is given, because a ruleset names it", async () => {
    const named = githubGate({ owner: "maple-kit", repo: "app", token: "t", name: "ci/visual" });
    await named.publish({ ...at, verdict: clear });

    expect(checks.runsOn(SHA)[0]?.name).toBe("ci/visual");
  });
});

describe("publishing twice about one commit", () => {
  it("updates the run in flight rather than stacking another beside it", async () => {
    await gate().publish({ ...at, verdict: blocked });
    await gate().publish({ ...at, verdict: blocked });

    expect(checks.runsOn(SHA)).toHaveLength(1);
  });

  it("lets a blocked commit go clear with no new commit", async () => {
    await gate().publish({ ...at, verdict: blocked });
    await gate().publish({ ...at, verdict: clear });

    expect(checks.runsOn(SHA)).toHaveLength(1);
    expect(await gate().read!(at)).toMatchObject({ conclusion: "clear" });
  });

  it("supersedes a completed run rather than reopening it", async () => {
    await gate().publish({ ...at, verdict: clear });
    await gate().publish({ ...at, verdict: blocked });

    expect(checks.runsOn(SHA)).toHaveLength(2);
    expect(await gate().read!(at)).toMatchObject({ conclusion: "blocked" });
  });
});

describe("reading the gate back", () => {
  it("carries the counts through external_id, not through the prose", async () => {
    const verdict = decideGate([
      storedComment({ id: "a", status: "open" }),
      storedComment({ id: "b", status: "resolved" }),
    ]);
    await gate().publish({ ...at, verdict });

    expect(await gate().read!(at)).toMatchObject({
      conclusion: "blocked",
      reason: "comments-open",
      open: 1,
      total: 2,
    });
  });

  it("says nothing about a commit with no run", async () => {
    expect(await gate().read!({ ...at, sha: "deadbeef" })).toBeUndefined();
  });

  it("does not guess at a run some other tool created under the same name", async () => {
    server.use(
      http.get(`${API}/repos/maple-kit/app/commits/${SHA}/check-runs`, () =>
        HttpResponse.json({
          total_count: 1,
          check_runs: [
            {
              id: 9,
              status: "completed",
              conclusion: "success",
              external_id: null,
              output: { title: "Something else", summary: "" },
            },
          ],
        }),
      ),
    );

    expect(await gate().read!(at)).toMatchObject({ reason: "unreadable", open: 0, total: 0 });
  });
});

describe("when GitHub says no", () => {
  it("carries GitHub's own message rather than inventing one", async () => {
    server.use(
      http.post(`${API}/repos/maple-kit/app/check-runs`, () =>
        HttpResponse.json({ message: "Resource not accessible by integration" }, { status: 403 }),
      ),
    );

    await expect(gate().publish({ ...at, verdict: blocked })).rejects.toThrow(
      /GitHub 403 .*not accessible by integration/,
    );
  });
});

/**
 * Found by running it, with two publishers GitHub will not let edit each
 * other's runs. `docs/gate.md` is the case.
 */
describe("when another App already published under this name", () => {
  function owned() {
    return githubGate({
      owner: "maple-kit",
      repo: "app",
      token: "gate-token",
      appId: MAPLE_APP,
    });
  }

  it("supersedes a foreign run rather than being refused by GitHub", async () => {
    checks.as(ACTIONS_APP);
    await gate().publish({ ...at, verdict: blocked });

    checks.as(MAPLE_APP);
    await owned().publish({ ...at, verdict: clear });

    const runs = checks.runsOn(SHA);
    expect(runs).toHaveLength(2);
    expect(runs.at(-1)?.app.id).toBe(MAPLE_APP);
    expect(runs.at(-1)?.conclusion).toBe("success");
  });

  it("leaves the other App's run exactly as it found it", async () => {
    checks.as(ACTIONS_APP);
    await gate().publish({ ...at, verdict: blocked });
    const before = { ...checks.runsOn(SHA)[0] };

    checks.as(MAPLE_APP);
    await owned().publish({ ...at, verdict: clear });

    expect(checks.runsOn(SHA)[0]).toEqual(before);
  });

  it("still updates its own run in flight rather than piling up new ones", async () => {
    await owned().publish({ ...at, verdict: blocked });
    await owned().publish({ ...at, verdict: clear });

    const runs = checks.runsOn(SHA);
    expect(runs).toHaveLength(1);
    expect(runs[0]?.status).toBe("completed");
  });

  it("reads back its own verdict and not the other App's", async () => {
    checks.as(ACTIONS_APP);
    await gate().publish({ ...at, verdict: blocked });

    checks.as(MAPLE_APP);
    await owned().publish({ ...at, verdict: clear });

    expect((await owned().read?.(at))?.conclusion).toBe("clear");
  });

  it("without an appId behaves as it always did, and GitHub refuses it", async () => {
    checks.as(ACTIONS_APP);
    await gate().publish({ ...at, verdict: blocked });

    checks.as(MAPLE_APP);
    await expect(gate().publish({ ...at, verdict: clear })).rejects.toThrow(/403/u);
  });
});
