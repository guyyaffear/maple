import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createLogger, memorySink } from "../src/logger/index.js";
import { captureContext, createDraftStore, toCommentContext } from "../src/overlay/index.js";

import type { Draft, DraftStore } from "../src/overlay/index.js";
import type { MediaRef } from "../src/types.js";

function draft(id: string, body: string, updatedAt = "2026-09-18T10:00:00.000Z"): Draft {
  return { id, body, anchor: { key: `msg:${id}` }, updatedAt };
}

/**
 * A reload keeps nothing but `Storage`. An `about:blank` iframe is this origin
 * in a fresh realm, so what it reads came out of storage, not out of memory.
 */
function reopen(branch: string): DraftStore {
  const frame = document.createElement("iframe");
  frame.src = "about:blank";
  document.body.append(frame);

  const storage = frame.contentWindow?.localStorage;
  if (!storage) throw new Error("The reloaded realm has no storage.");
  return createDraftStore({ branch, storage });
}

beforeEach(() => localStorage.clear());
afterEach(() => {
  for (const frame of document.querySelectorAll("iframe")) frame.remove();
});

describe("drafts", () => {
  it("keeps a draft across two opens of the same branch", () => {
    createDraftStore({ branch: "feat/x" }).save(draft("1", "spacing is off"));
    expect(createDraftStore({ branch: "feat/x" }).list()).toEqual([draft("1", "spacing is off")]);
  });

  it("does not leak a draft from one branch into another", () => {
    createDraftStore({ branch: "feat/x" }).save(draft("1", "a"));
    expect(createDraftStore({ branch: "feat/y" }).list()).toEqual([]);
  });

  it("replaces a draft saved again under the same id", () => {
    const store = createDraftStore({ branch: "feat/x" });
    store.save(draft("1", "first"));
    store.save(draft("1", "second"));

    expect(store.list()).toHaveLength(1);
    expect(store.list()[0]?.body).toBe("second");
  });

  it("lists the newest first", () => {
    const store = createDraftStore({ branch: "feat/x" });
    store.save(draft("old", "a", "2026-09-01T00:00:00.000Z"));
    store.save(draft("new", "b", "2026-09-18T00:00:00.000Z"));

    expect(store.list().map((entry) => entry.id)).toEqual(["new", "old"]);
  });

  it("removes one and clears all", () => {
    const store = createDraftStore({ branch: "feat/x" });
    store.save(draft("1", "a"));
    store.save(draft("2", "b"));
    store.remove("1");
    expect(store.list().map((entry) => entry.id)).toEqual(["2"]);

    store.clear();
    expect(store.list()).toEqual([]);
  });
});

describe("drafts, when storage misbehaves", () => {
  it("discards unreadable contents rather than throwing", () => {
    localStorage.setItem("maple:drafts:feat/x", "{ not json");
    const sink = memorySink();
    const store = createDraftStore({
      branch: "feat/x",
      logger: createLogger({ sinks: [sink], level: "debug" }),
    });

    expect(store.list()).toEqual([]);
    expect(sink.records.some((record) => record.level === "warn")).toBe(true);
  });

  it("drops entries that are not drafts and keeps the ones that are", () => {
    localStorage.setItem("maple:drafts:feat/x", JSON.stringify([draft("1", "a"), { id: 2 }, null]));
    expect(createDraftStore({ branch: "feat/x" }).list()).toHaveLength(1);
  });

  it("keeps working in memory when writing is refused", () => {
    const sink = memorySink();
    const refusing: Storage = {
      ...localStorage,
      getItem: () => null,
      setItem: () => {
        throw new DOMException("QuotaExceededError");
      },
      removeItem: () => undefined,
      clear: () => undefined,
      key: () => null,
      length: 0,
    };
    const store = createDraftStore({
      branch: "feat/x",
      storage: refusing,
      logger: createLogger({ sinks: [sink], level: "debug" }),
    });

    store.save(draft("1", "a"));
    expect(store.list()).toHaveLength(1);
    expect(sink.records.some((record) => record.level === "warn")).toBe(true);
  });
});

describe("a draft that is comment-shaped", () => {
  const attachments: readonly MediaRef[] = [
    { connector: "github", key: "pasted-screenshot.png", contentType: "image/png" },
  ];

  it("comes back whole after a reload, attachments and context included", () => {
    const unsent: Draft = {
      ...draft("1", "the yield card wraps at this width"),
      context: toCommentContext(captureContext()),
      attachments,
    };
    createDraftStore({ branch: "feat/x" }).save(unsent);

    const restored = reopen("feat/x").list();
    expect(restored).toEqual([unsent]);
  });

  it("restores the content width the badge is built from", () => {
    createDraftStore({ branch: "feat/x" }).save({
      ...draft("1", "a"),
      context: toCommentContext(captureContext()),
    });

    const restored = reopen("feat/x").list()[0];
    expect(restored?.context?.contentWidth).toBe(document.documentElement.clientWidth);
    expect(restored?.context?.viewportWidth).toBe(window.innerWidth);
  });

  it("leaves a draft with nothing attached alone", () => {
    createDraftStore({ branch: "feat/x" }).save(draft("1", "a"));

    const restored = reopen("feat/x").list()[0];
    expect(restored?.attachments).toBeUndefined();
    expect(restored?.context).toBeUndefined();
  });
});
