import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { createMapleClient, MAPLE_DEFAULTS, resolveConfig } from "../src/client/index.js";
import { DEFAULT_PILLARS } from "../src/connectors/index.js";
import { createMapleFake, MAPLE_BASE } from "./msw/maple.js";
import { createTestServer, useTestServer } from "./msw/server.js";

import type { ComposerTarget, MapleClient, MapleClientOptions } from "../src/client/index.js";
import type { MapleFake } from "./msw/maple.js";

const TARGET: ComposerTarget = { kind: "element", anchor: { component: "YieldCard" } };
const WRITTEN = "The Save button's label is cut off at 320px.";

const server = createTestServer();
useTestServer(server, { afterAll, afterEach, beforeAll });

let fake: MapleFake;

function storage(): Storage {
  const held = new Map<string, string>();
  return {
    get length() {
      return held.size;
    },
    clear: () => held.clear(),
    getItem: (key) => held.get(key) ?? null,
    key: (index) => [...held.keys()][index] ?? null,
    removeItem: (key) => {
      held.delete(key);
    },
    setItem: (key, value) => {
      held.set(key, value);
    },
  };
}

function client(overrides: Partial<MapleClientOptions> = {}): MapleClient {
  return createMapleClient({
    branch: "feat/x",
    basePath: MAPLE_BASE,
    storage: storage(),
    origin: "https://preview.example.com",
    debounceMs: 0,
    ...overrides,
  });
}

/** Loads, opens a composer and types, then lets the debounce and the call run. */
async function typed(maple: MapleClient, body: string): Promise<void> {
  maple.openComposer(TARGET);
  maple.setBody(body);
  await vi.advanceTimersByTimeAsync(700);
}

beforeEach(() => {
  fake = createMapleFake({ pillars: DEFAULT_PILLARS });
  server.use(...fake.handlers);
  vi.useFakeTimers();
});

afterEach(() => vi.useRealTimers());

describe("a comment judged as it is written", () => {
  it("knows what can be judged before anything is typed", async () => {
    const maple = client();
    await maple.load();

    expect(maple.getState().assist?.pillars).toHaveLength(DEFAULT_PILLARS.length);
    expect(fake.judged()).toEqual([]);
  });

  it("puts the judgement on the composer, from the route", async () => {
    const maple = client();
    await maple.load();
    await typed(maple, WRITTEN);

    const { assist } = maple.getState().composer;
    expect(fake.judged()).toEqual([WRITTEN]);
    expect(assist.status).toBe("ready");
    expect(assist.scores).toHaveLength(DEFAULT_PILLARS.length);
    expect(assist.kind?.kind).toBe("bug");
  });

  it("judges nothing at all when the deployment configured no classifier", async () => {
    fake = createMapleFake();
    server.use(...fake.handlers);

    const maple = client();
    await maple.load();
    await typed(maple, WRITTEN);

    expect(maple.getState().assist).toBeNull();
    expect(fake.judged()).toEqual([]);
  });

  it("judges nothing when the link said not to", async () => {
    const maple = client({ config: resolveConfig({ query: { assist: false } }) });
    await maple.load();
    await typed(maple, WRITTEN);

    expect(maple.getState().assist).toBeNull();
    expect(fake.judged()).toEqual([]);
  });

  it("is on by default, and a deployment can start it off", () => {
    expect(MAPLE_DEFAULTS.assist).toBe(true);
    expect(resolveConfig({ props: { assist: false } }).assist).toBe(false);
    expect(resolveConfig({ query: { assist: true }, props: { assist: false } }).assist).toBe(true);
  });

  it("forgets the judgement when the composer closes, and asks nothing more", async () => {
    const maple = client();
    await maple.load();
    await typed(maple, WRITTEN);

    maple.closeComposer();
    expect(maple.getState().composer.assist.status).toBe("idle");

    await vi.advanceTimersByTimeAsync(700);
    expect(fake.judged()).toEqual([WRITTEN]);
  });

  it("judges a resumed draft on sight, so the card is not blank", async () => {
    const maple = client();
    await maple.load();
    await typed(maple, WRITTEN);
    maple.closeComposer();

    maple.openComposer(TARGET);
    await vi.advanceTimersByTimeAsync(700);

    expect(fake.judged()).toEqual([WRITTEN, WRITTEN]);
    expect(maple.getState().composer.assist.status).toBe("ready");
  });

  it("stops judging when the viewer turns it off, and remembers that", async () => {
    const held = storage();
    const maple = client({ storage: held });
    await maple.load();

    maple.setAssist(false);
    await typed(maple, WRITTEN);

    expect(maple.getState().assist).toBeNull();
    expect(fake.judged()).toEqual([]);
    expect(held.getItem("maple:prefs:https://preview.example.com")).toContain('"assist":false');
  });

  it("keeps the field working when the route cannot judge", async () => {
    server.use(...createMapleFake().handlers);
    const maple = client();
    await maple.load();
    fake = createMapleFake({ pillars: DEFAULT_PILLARS });
    server.use(...fake.handlers);

    await typed(maple, WRITTEN);
    maple.setBody(`${WRITTEN} More.`);

    expect(maple.getState().composer.body).toBe(`${WRITTEN} More.`);
    expect(maple.getState().composer.sending).toBe(false);
  });
});
