import { createMapleClient } from "@maple-kit/core/client";
import { storedComment } from "@maple-kit/core/testing";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { createSnapshots } from "../src/index.js";
import { createMapleFake, MAPLE_BASE, mapleUnavailable } from "./msw/maple.js";
import { createTestServer, useTestServer } from "./msw/server.js";

import type { Snapshots } from "../src/index.js";
import type { ComposerTarget, MapleClient } from "@maple-kit/core/client";

const BRANCH = "feat/x";
const TARGET: ComposerTarget = { kind: "element", anchor: { component: "YieldCard" } };

/**
 * The binding's reads, without React. Everything React does with them is
 * `Object.is` on what they return, so identity is the whole contract.
 */
function open(): { client: MapleClient; reads: Snapshots } {
  const client = createMapleClient({ branch: BRANCH, debounceMs: 0 });
  return { client, reads: createSnapshots(client) };
}

describe("subscribing to the controller", () => {
  it("delivers while subscribed and stops the moment it is not", () => {
    const { client, reads } = open();
    let changes = 0;

    const unsubscribe = reads.subscribe(() => (changes += 1));
    client.setFilter("open");
    client.arm("element");
    expect(changes).toBe(2);

    unsubscribe();
    client.setFilter("all");
    expect(changes).toBe(2);
  });

  it("hands out one subscribe function, which is what stops a resubscribe", () => {
    const { reads } = open();
    expect(reads.subscribe).toBe(reads.subscribe);
    expect(createSnapshots(createMapleClient({ branch: BRANCH })).subscribe).not.toBe(
      reads.subscribe,
    );
  });
});

/**
 * A narrow hook must hand back the identical value when something it does not
 * read changed, or every mark on the page re-renders on every keystroke.
 */
describe("a change a hook does not read", () => {
  const cases: ReadonlyArray<{
    name: string;
    read: (reads: Snapshots) => unknown;
    unrelated: (client: MapleClient) => void;
    related: (client: MapleClient) => void;
  }> = [
    {
      name: "the composer",
      read: (reads) => reads.composer(),
      unrelated: (client) => client.arm("element"),
      related: (client) => client.openComposer(TARGET),
    },
    {
      name: "the picker",
      read: (reads) => reads.picker(),
      unrelated: (client) => client.setFilter("open"),
      related: (client) => client.arm("region"),
    },
    {
      name: "the comment list",
      read: (reads) => reads.comments(),
      unrelated: (client) => client.arm("text"),
      related: (client) => client.setFilter("resolved"),
    },
    {
      name: "the draft",
      read: (reads) => reads.draft(),
      unrelated: (client) => client.setFilter("open"),
      related: (client) => client.setBody("The spacing is off."),
    },
  ];

  for (const { name, read, unrelated, related } of cases) {
    it(`leaves ${name} identical`, () => {
      const { client, reads } = open();
      client.openComposer(TARGET);
      const before = read(reads);

      unrelated(client);
      expect(read(reads)).toBe(before);
    });

    it(`replaces ${name} when it is the thing that changed`, () => {
      const { client, reads } = open();
      client.openComposer(TARGET);
      const before = read(reads);

      related(client);
      expect(read(reads)).not.toBe(before);
    });
  }
});

describe("the comment list", () => {
  it("caches per filter, so two hooks on two filters do not evict each other", () => {
    const { reads } = open();
    const all = reads.comments("all");
    const unpinned = reads.comments("unpinned");

    expect(reads.comments("all")).toBe(all);
    expect(reads.comments("unpinned")).toBe(unpinned);
  });

  it("re-reads when the controller's own filter moved under an unfiltered hook", () => {
    const { client, reads } = open();
    const before = reads.comments();

    client.setFilter("needs_reverify");
    expect(reads.comments()).not.toBe(before);
  });
});

describe("anchors and drafts, by id", () => {
  it("finds the anchor the composer is pointed at", () => {
    const { client, reads } = open();
    client.openComposer(TARGET);
    const { draftId } = client.getState().composer;

    expect(reads.anchor(draftId ?? "")).toEqual(TARGET.anchor);
    expect(reads.anchor("nothing-here")).toBeUndefined();
  });

  it("finds the draft the composer is writing into without being told its id", () => {
    const { client, reads } = open();
    client.openComposer(TARGET);
    client.setBody("The spacing is off.");
    const { draftId } = client.getState().composer;

    expect(reads.draft()?.body).toBe("The spacing is off.");
    expect(reads.draft(draftId)).toBe(reads.draft());
    expect(reads.draft("nothing-here")).toBeUndefined();
  });

  it("has no draft and no anchor before anything is picked", () => {
    const { reads } = open();
    expect(reads.draft()).toBeUndefined();
    expect(reads.anchor("c_1")).toBeUndefined();
  });
});

/** The route, through msw, including the failure a binding has to render. */
describe("reading what the route returned", () => {
  const fake = createMapleFake();
  const server = createTestServer(...fake.handlers);
  useTestServer(server, { beforeAll, afterEach, afterAll });

  function client(): MapleClient {
    return createMapleClient({ branch: BRANCH, basePath: MAPLE_BASE });
  }

  it("shows the branch's comments once they have loaded", async () => {
    fake.seed(storedComment({ id: "c_1" }), storedComment({ id: "c_2", status: "resolved" }));
    const maple = client();
    const reads = createSnapshots(maple);

    await maple.load();

    expect(reads.state().phase).toBe("ready");
    expect(reads.comments().map((one) => one.id)).toEqual(["c_1"]);
    expect(reads.comments("resolved").map((one) => one.id)).toEqual(["c_2"]);
    expect(reads.comments()).toBe(reads.comments());

    maple.setShowResolved(true);
    expect(reads.comments().map((one) => one.id)).toEqual(["c_1", "c_2"]);
  });

  it("puts a route that failed into words a reviewer can read", async () => {
    server.use(mapleUnavailable());
    const maple = client();
    const reads = createSnapshots(maple);

    await maple.load();

    expect(reads.state().phase).toBe("error");
    expect(reads.state().error).toMatchObject({ during: "load", kind: "store", status: 500 });
    expect(reads.comments()).toEqual([]);
  });
});
