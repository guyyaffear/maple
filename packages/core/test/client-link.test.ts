import { describe, expect, it, vi } from "vitest";

import { startLink } from "../src/client/index.js";
import { MapleRequestError } from "../src/client/transport.js";

import type { GitHubLink } from "../src/client/index.js";
import type { LinkAttempt, LinkStart, Transport } from "../src/client/transport.js";

const STARTED: LinkStart = {
  userCode: "WDJB-MJHT",
  verificationUri: "https://github.com/login/device",
  expiresAt: 900_000,
  interval: 5,
};

/** Only the three calls a link makes. The rest of the transport is not reached. */
function transport(attempts: (LinkAttempt | Error)[], started: LinkStart = STARTED): Transport {
  const queue = [...attempts];
  return {
    linkStart: () => Promise.resolve(started),
    linkAttempt: () => {
      const next = queue.shift();
      if (next instanceof Error) return Promise.reject(next);
      return Promise.resolve(next ?? { status: "pending", interval: 5 });
    },
    linkEnd: () => Promise.resolve(),
  } as unknown as Transport;
}

/** Records what the poller was asked to wait, and waits none of it. */
function recorder(): { waited: number[]; sleep: (ms: number) => Promise<void> } {
  const waited: number[] = [];
  return { waited, sleep: (ms) => (waited.push(ms), Promise.resolve()) };
}

/** A wait that never finishes, so a run stalls after reporting its code. */
function stalled(): (ms: number) => Promise<void> {
  return () => new Promise<void>(() => undefined);
}

/** Collects every state the run reports, in order. */
function collector(): { seen: GitHubLink[]; onChange: (link: GitHubLink) => void } {
  const seen: GitHubLink[] = [];
  return {
    seen,
    onChange: (link) => {
      seen.push(link);
    },
  };
}

describe("starting a link", () => {
  it("reports the code before any polling, so the surface can draw it", async () => {
    const { seen, onChange } = collector();

    await startLink({ transport: transport([]), onChange, sleep: stalled(), now: () => 0 });

    expect(seen[0]).toMatchObject({ state: "linking", userCode: "WDJB-MJHT" });
  });

  it("carries the four things a surface draws, and nothing else", async () => {
    const { seen, onChange } = collector();
    await startLink({ transport: transport([]), onChange, sleep: stalled(), now: () => 0 });

    expect([...Object.keys(seen[0] ?? {})].sort((a, b) => a.localeCompare(b))).toEqual([
      "expiresAt",
      "state",
      "userCode",
      "verificationUri",
    ]);
  });
});

describe("polling", () => {
  it("waits the interval GitHub asked for, and honours a new one", async () => {
    const { waited, sleep } = recorder();
    const { seen, onChange } = collector();

    await startLink({
      transport: transport([
        { status: "pending", interval: 10 },
        { status: "linked", login: "octocat" },
      ]),
      onChange,
      sleep,
      now: () => 0,
    });

    await vi.waitFor(() => expect(seen.at(-1)?.state).toBe("linked"));
    expect(waited).toEqual([5000, 10_000]);
  });

  it("ends linked, and names the reviewer", async () => {
    const { seen, onChange } = collector();

    await startLink({
      transport: transport([{ status: "linked", login: "octocat" }]),
      onChange,
      sleep: () => Promise.resolve(),
      now: () => 0,
    });

    await vi.waitFor(() => expect(seen.at(-1)).toEqual({ state: "linked", login: "octocat" }));
  });

  it("ends linked without a login when GitHub would not name them", async () => {
    const { seen, onChange } = collector();

    await startLink({
      transport: transport([{ status: "linked" }]),
      onChange,
      sleep: () => Promise.resolve(),
      now: () => 0,
    });

    await vi.waitFor(() => expect(seen.at(-1)).toEqual({ state: "linked" }));
  });

  it("carries the route's own words when it refuses, not a status number", async () => {
    const { seen, onChange } = collector();

    await startLink({
      transport: transport([
        new MapleRequestError(403, "/auth/github", "The reviewer said no to the app."),
      ]),
      onChange,
      sleep: () => Promise.resolve(),
      now: () => 0,
    });

    await vi.waitFor(() =>
      expect(seen.at(-1)).toEqual({
        state: "failed",
        reason: "The reviewer said no to the app.",
      }),
    );
  });

  it("gives up when the code expires, rather than polling a dead code forever", async () => {
    const { seen, onChange } = collector();

    await startLink({
      transport: transport([]),
      onChange,
      sleep: () => Promise.resolve(),
      now: () => 900_001,
    });

    await vi.waitFor(() => expect(seen.at(-1)).toEqual({ state: "failed", reason: "expired" }));
  });
});

describe("cancelling", () => {
  it("reports nothing after it is cancelled", async () => {
    const { seen, onChange } = collector();
    let release = (): void => undefined;
    const held = new Promise<void>((done) => (release = done));

    const run = await startLink({
      transport: transport([{ status: "linked", login: "octocat" }]),
      onChange,
      sleep: () => held,
      now: () => 0,
    });

    run.cancel();
    release();
    await held;
    await Promise.resolve();

    expect(seen).toHaveLength(1);
    expect(seen[0]?.state).toBe("linking");
  });
});
