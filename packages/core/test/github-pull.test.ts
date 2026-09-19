import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { createPullCache, githubStore } from "../src/connectors/index.js";
import { sampleComment } from "../src/testing/fixtures.js";
import { createGitHubFake, pullFor } from "./msw/github.js";
import { createTestServer, useTestServer } from "./msw/server.js";

import type { GitHubStoreOptions } from "../src/connectors/index.js";

const github = createGitHubFake();
const server = createTestServer(...github.handlers);

useTestServer(server, { beforeAll, afterEach, afterAll });

function store(overrides: Partial<GitHubStoreOptions> = {}) {
  return githubStore({ owner: "maple-kit", repo: "app", token: "test-token", ...overrides });
}

afterEach(() => github.reset());

/** A preview hostname is a DNS label, so it carries a ticket or a shortened
 * branch — and the branch name is the one thing the browser does not know. */
describe("finding the pull request from a commit", () => {
  const SHA = "a1b2c3d4e5f6";

  it("uses the commit before the identifier, because it is exact", async () => {
    github.commit(SHA, "feat/real-branch");
    await store({ pull: { commit: SHA } }).append(sampleComment({ branch: "pla-1903" }));

    expect(github.commentsOn(pullFor("feat/real-branch"))).toHaveLength(1);
  });

  it("falls back to the identifier when the commit is on no pull request", async () => {
    await store({ pull: { commit: SHA } }).append(sampleComment({ branch: "feat/named" }));

    expect(github.commentsOn(pullFor("feat/named"))).toHaveLength(1);
  });

  it("reads back from the same pull request it wrote to", async () => {
    github.commit(SHA, "feat/real-branch");
    const connector = store({ pull: { commit: SHA } });
    await connector.append(sampleComment({ branch: "pla-1903", body: "the gap" }));

    const page = await connector.list({ branch: "pla-1903" });
    expect(page.comments.map((one) => one.body)).toEqual(["the gap"]);
  });
});

describe("finding it by what the application calls the branch", () => {
  /** The same reduction the hostname was built with, as an application has it. */
  const ticket = (head: string, identifier: string): boolean =>
    head.toLowerCase().startsWith(`${identifier.toLowerCase()}-`);

  it("asks the application which open pull request an identifier belongs to", async () => {
    github.open("pla-1903-grouped-cases-chip-link", "pla-1870-other");
    await store({ pull: { matches: ticket } }).append(sampleComment({ branch: "pla-1903" }));

    expect(github.commentsOn(pullFor("pla-1903-grouped-cases-chip-link"))).toHaveLength(1);
  });

  it("takes the most recently updated where several would match", async () => {
    github.open("pla-1903-second", "pla-1903-first");
    await store({ pull: { matches: ticket } }).append(sampleComment({ branch: "pla-1903" }));

    expect(github.commentsOn(pullFor("pla-1903-second"))).toHaveLength(1);
  });

  it("is not asked at all when the identifier is the branch's own name", async () => {
    let asked = 0;
    const counting = (head: string, identifier: string) => {
      asked += 1;
      return ticket(head, identifier);
    };

    await store({ pull: { matches: counting } }).append(sampleComment({ branch: "feat/named" }));
    expect(asked).toBe(0);
  });

  it("lists nothing rather than failing when nothing matches", async () => {
    github.open("pla-1870-other");
    const page = await store({ pull: { matches: ticket } }).list({ branch: "pla-1903" });

    expect(page).toEqual({ comments: [] });
  });
});

/**
 * A per-reviewer credential means a store built per request, so the cache has
 * to outlive the store rather than sit in its closure.
 */
describe("remembering what was resolved", () => {
  it("asks GitHub once across stores that share a cache", async () => {
    const cache = createPullCache();
    await store({ cache }).list({ branch: "feat/named" });
    const first = github.lookups();

    await store({ cache }).list({ branch: "feat/named" });
    expect(github.lookups()).toBe(first);
  });

  it("asks again without one, because nothing was kept", async () => {
    await store().list({ branch: "feat/named" });
    const first = github.lookups();

    await store().list({ branch: "feat/named" });
    expect(github.lookups()).toBeGreaterThan(first);
  });

  it("keys on the commit where there is one, so two labels on it share", async () => {
    const cache = createPullCache();
    github.commit("deadbee", "feat/real-branch");

    await store({ cache, pull: { commit: "deadbee" } }).list({ branch: "pla-1903" });
    const first = github.lookups();
    await store({ cache, pull: { commit: "deadbee" } }).list({ branch: "pla-1904" });

    expect(github.lookups()).toBe(first);
  });

  /** Push the branch, the preview builds, the pull request is opened after. */
  it("asks again after a miss, because one can be opened later", async () => {
    const cache = createPullCache();
    await store({ cache }).list({ branch: "no-pull/x" });
    const first = github.lookups();

    await store({ cache }).list({ branch: "no-pull/x" });
    expect(github.lookups()).toBeGreaterThan(first);
  });
});
