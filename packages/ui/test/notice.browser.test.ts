import { createMapleClient } from "@maple-kit/core/client";
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { MapleActions } from "../src/composer/actions.js";
import { MapleComposer } from "../src/composer/composer.js";
import { MapleRoot } from "../src/index.js";
import { Island, IslandContent, List } from "../src/island/index.js";
import { MapleNotice } from "../src/notice/index.js";
import { BRANCH, refusingFetch } from "./fixtures.js";

import type { RefusalOptions } from "./fixtures.js";
import type { MapleClient } from "@maple-kit/core/client";
import type { ReactElement } from "react";

/** The card, with the notice above the list, as the composition mounts it. */
function tree(options: RefusalOptions): ReactElement {
  return createElement(
    MapleRoot,
    { branch: BRANCH, theme: "light", options: { fetch: refusingFetch(options) } },
    createElement(
      Island,
      { defaultOpen: true },
      createElement(IslandContent, null, createElement(MapleNotice), createElement(List)),
    ),
  );
}

function root(): ShadowRoot {
  const host = document.querySelector<HTMLElement>("[data-maple-overlay]");
  if (!host?.shadowRoot) throw new Error("no overlay is mounted");
  return host.shadowRoot;
}

function notice(): HTMLElement | null {
  return root().querySelector<HTMLElement>(".mk-notice");
}

async function shown(kind: string): Promise<HTMLElement> {
  await vi.waitFor(() => expect(notice()?.dataset["mkKind"]).toBe(kind));
  return notice()!;
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.setAttribute("data-theme", "light");
});

afterEach(() => {
  document.documentElement.removeAttribute("data-theme");
  for (const node of document.querySelectorAll("[data-maple-overlay]")) node.remove();
});

describe("a store that refuses this reviewer", () => {
  it("says so, rather than drawing a branch with nothing on it", async () => {
    await render(tree({ status: 401, github: { linked: false } }));
    const found = await shown("unauthorized");

    expect(found.textContent).toContain("Sign in");
    expect(found.getAttribute("role")).toBe("alert");
  });

  it("offers the sign-in on the card, not three clicks into settings", async () => {
    await render(tree({ status: 401, github: { linked: false } }));
    const found = await shown("unauthorized");

    expect(found.querySelector(".mk-notice-do")?.textContent).toBe("Sign in");
  });

  it("offers no door where the deployment has none to offer", async () => {
    await render(tree({ status: 401 }));
    const found = await shown("unauthorized");

    expect(found.querySelector(".mk-notice-do")).toBeNull();
    expect(found.textContent).toContain("nowhere to put your comments");
  });
});

describe("a store that broke", () => {
  it("offers the one thing that might work, which is asking again", async () => {
    await render(tree({ status: 500 }));
    const found = await shown("store");

    expect(found.querySelector(".mk-notice-do")?.textContent).toBe("Try again");
  });

  it("keeps the route's own words off the page and out of the overlay", async () => {
    await render(tree({ status: 500 }));
    const found = await shown("store");

    expect(found.textContent).not.toContain("no store to write to");
  });

  it("goes when it is dismissed, and takes nothing else with it", async () => {
    await render(tree({ status: 500 }));
    await shown("store");

    root().querySelector<HTMLButtonElement>(".mk-notice-off")!.click();
    await vi.waitFor(() => expect(notice()).toBeNull());
    expect(root().querySelector(".mk-list")).toBeTruthy();
  });
});

describe("the list under a failed load", () => {
  it("does not claim the branch is empty, because it does not know", async () => {
    await render(tree({ status: 500 }));
    await shown("store");

    expect(root().querySelector(".mk-empty")?.textContent).toContain("not the whole story");
  });
});

/** The panel, with the notice where the composition puts it: above the buttons. */
function panel(client: MapleClient): ReactElement {
  return createElement(
    MapleRoot,
    { branch: BRANCH, theme: "light", client },
    createElement(
      MapleComposer,
      null,
      createElement(MapleNotice, { key: "n", during: ["send"] }),
      createElement(MapleActions, { key: "f" }),
    ),
  );
}

describe("a send the store refused", () => {
  it("says so on the panel, where the button that did nothing is", async () => {
    const client = createMapleClient({
      branch: BRANCH,
      fetch: refusingFetch({ status: 500 }),
      debounceMs: 0,
    });
    client.start();
    client.openComposer({ kind: "element", anchor: { component: "YieldCard" } });
    client.setBody("The spacing is off.");

    await render(panel(client));
    await vi.waitFor(() => expect(root().querySelector(".mk-composer")).not.toBeNull());
    root().querySelector<HTMLButtonElement>(".mk-btn-primary")!.click();

    const found = await shown("store");
    expect(found.textContent).toContain("kept here");
    client.destroy();
  });
});
