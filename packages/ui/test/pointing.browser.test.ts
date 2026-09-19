import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { page } from "vitest/browser";

import { Maple } from "../src/maple.js";
import { fixtureFetch } from "./fixtures.js";

import type { Comment } from "@maple-kit/core";
import type { ReactElement } from "react";

const BRANCH = "feat/ui-pointing";

const CONTEXT = {
  url: "https://preview.example/dashboard",
  viewportWidth: 1180,
  viewportHeight: 900,
  contentWidth: 1180,
  devicePixelRatio: 2,
  colorScheme: "light",
  breakpoint: "lg",
} as const;

/** One card and one paragraph, both tagged the way a build's tagger tags them. */
const PAGE = `
<div data-maple-name="YieldCard" data-maple-src="app/dashboard/page.tsx:42:7"
     data-maple-label="the Yield card" style="height: 70px">Yield</div>
<p data-maple-name="GateNotice" data-maple-label="the gate notice" style="width: 260px">
  A pull request with an open comment is held until an agent resolves it or a reviewer
  closes it, which is long enough to select part of.
</p>
`;

/** An element pick on the card, and a text pick inside the paragraph. */
const COMMENTS: readonly Comment[] = [
  {
    id: "on-card",
    branch: BRANCH,
    body: "This delta is red for a drop, which is the good direction.",
    status: "open",
    createdAt: "2026-09-18T09:00:00.000Z",
    author: { id: "ada", name: "Ada", provenance: "server", colorSlot: 6 },
    anchor: { source: "app/dashboard/page.tsx:42:7", component: "YieldCard" },
    context: CONTEXT,
  },
  {
    id: "on-passage",
    branch: BRANCH,
    body: "Can this read “held” rather than naming the internal state?",
    status: "open",
    createdAt: "2026-09-19T09:00:00.000Z",
    author: { id: "grace", name: "Grace", provenance: "server", colorSlot: 0 },
    anchor: { component: "GateNotice", quote: { exact: "until an agent resolves it" } },
    context: CONTEXT,
  },
];

function root(): ShadowRoot {
  const host = document.querySelector<HTMLElement>("[data-maple-overlay]");
  if (!host?.shadowRoot) throw new Error("no overlay is mounted");
  return host.shadowRoot;
}

function find<T extends Element>(selector: string): T {
  const found = root().querySelector<T>(selector);
  if (!found) throw new Error(`nothing matched ${selector}`);
  return found;
}

function tree(): ReactElement {
  return createElement(Maple, {
    branch: BRANCH,
    theme: "light",
    options: { fetch: fixtureFetch(COMMENTS) },
  });
}

/** The mark standing for one comment, once the layer has drawn it. */
async function mark(address: number): Promise<HTMLElement> {
  await vi.waitFor(() => expect(root().querySelectorAll(".mk-mark")).toHaveLength(2));
  return find<HTMLElement>(`.mk-mark[aria-label^="Comment ${String(address)}"]`);
}

function point(node: HTMLElement, over: boolean): void {
  const type = over ? "pointerover" : "pointerout";
  node.dispatchEvent(
    new PointerEvent(type, { bubbles: true, ...(over ? {} : { relatedTarget: document.body }) }),
  );
}

async function ring(): Promise<HTMLElement> {
  await vi.waitFor(() => expect(root().querySelector(".mk-ring")).not.toBeNull());
  return find<HTMLElement>(".mk-ring");
}

let search = "";

beforeEach(async () => {
  localStorage.clear();
  document.documentElement.setAttribute("data-theme", "light");
  await page.viewport(1180, 860);
  const fixture = document.createElement("div");
  fixture.setAttribute("data-fixture-page", "");
  fixture.innerHTML = PAGE;
  document.body.append(fixture);
  history.replaceState({}, "", search === "" ? location.pathname : `?${search}`);
  await render(tree());
});

afterEach(() => {
  search = "";
  history.replaceState({}, "", location.pathname);
  document.documentElement.removeAttribute("data-theme");
  for (const node of document.querySelectorAll("[data-maple-overlay], [data-fixture-page]")) {
    node.remove();
  }
});

/**
 * A mark is the one thing on the page that says a comment is here, so pointing
 * at it has to answer "which one" without asking for a click first.
 */
describe("pointing at a mark", () => {
  it("rings what it is on and names it, before anything is clicked", async () => {
    point(await mark(1), true);
    const node = await ring();

    expect(node.getAttribute("data-mk-state")).toBe("hovered");
    expect(find(".mk-ring-name").textContent).toBe("the Yield card");
  });

  it("lets the ring go again the moment the pointer leaves", async () => {
    const node = await mark(1);
    point(node, true);
    await ring();

    point(node, false);
    await vi.waitFor(() => expect(root().querySelector(".mk-ring")).toBeNull());
  });

  it("highlights the passage a text comment is on, not the paragraph round it", async () => {
    point(await mark(2), true);
    await ring();

    await vi.waitFor(() =>
      expect(root().querySelectorAll(".mk-ring-run").length).toBeGreaterThan(0),
    );
    expect(find(".mk-ring").getAttribute("data-mk-passage")).toBe("true");
  });
});

/** A click is the gesture that outlives the hand: it holds what hover shows. */
describe("clicking a mark", () => {
  async function click(address: number): Promise<HTMLElement> {
    const node = await mark(address);
    node.click();
    point(node, false);
    return node;
  }

  it("keeps the ring on the page after the pointer has moved away", async () => {
    await click(1);

    await vi.waitFor(() => expect(find(".mk-ring").getAttribute("data-mk-state")).toBe("selected"));
    expect(find(".mk-ring-name").textContent).toBe("the Yield card");
  });

  it("opens the comment it stands for, which is what a mark is for", async () => {
    await click(1);

    await vi.waitFor(() => expect(root().querySelector(".mk-read")).not.toBeNull());
    expect(find(".mk-read").textContent).toBe(COMMENTS[0]?.body);
    expect(find(".mk-composer").getAttribute("data-mk-open")).toBe("true");
  });

  it("opens the inventory with it, so the comment sits among the others", async () => {
    await click(1);

    await vi.waitFor(() => expect(root().querySelector(".mk-card")).not.toBeNull());
    expect(find(".mk-row[data-mk-selected='true']")).toBeInstanceOf(HTMLElement);
  });

  /** Otherwise the inventory opens and nothing in it says which row it opened on. */
  it("marks the row it landed on, apart from the wash a hover gives", async () => {
    await click(1);
    await vi.waitFor(() => expect(root().querySelector(".mk-card")).not.toBeNull());

    const rows = [...root().querySelectorAll<HTMLElement>(".mk-row")];
    const landed = find<HTMLElement>(".mk-row[data-mk-selected='true']");
    const rest = rows.filter((row) => row !== landed);

    expect(getComputedStyle(landed).boxShadow).not.toBe("none");
    expect(rest.map((row) => getComputedStyle(row).boxShadow)).toEqual(rest.map(() => "none"));
  });

  it("glows in the leaf's own shape rather than behind its box", async () => {
    const node = await click(1);

    await vi.waitFor(() => expect(node.getAttribute("aria-pressed")).toBe("true"));
    expect(getComputedStyle(node).boxShadow).toBe("none");
    expect(getComputedStyle(node).filter).toContain("drop-shadow");
  });

  /** Otherwise a reader with the panel up cannot point at anything else. */
  it("gives the ring back to a pointer on another mark", async () => {
    await click(1);
    await vi.waitFor(() => expect(root().querySelector(".mk-read")).not.toBeNull());

    point(await mark(2), true);

    await vi.waitFor(() => expect(find(".mk-ring").getAttribute("data-mk-state")).toBe("hovered"));
    expect(find(".mk-ring-name").textContent).toBe("a passage in the gate notice");
  });
});

/** The panel is a surface beside the inventory, never a layer over it. */
describe("the inventory while a panel is open", () => {
  it("steps aside by the panel's own width instead of sitting under it", async () => {
    (await mark(1)).click();
    await vi.waitFor(() => expect(root().querySelector(".mk-read")).not.toBeNull());

    const island = find<HTMLElement>(".mk-island");
    await vi.waitFor(() => expect(island.getAttribute("data-mk-inset")).toBe("true"));

    const width = getComputedStyle(island).getPropertyValue("--mk-composer-w").trim();
    await vi.waitFor(() => expect(getComputedStyle(island).translate).toBe(`-${width}`));
  });

  it("comes back to its corner when the panel shuts", async () => {
    (await mark(1)).click();
    const island = find<HTMLElement>(".mk-island");
    await vi.waitFor(() => expect(island.getAttribute("data-mk-inset")).toBe("true"));

    find<HTMLButtonElement>(".mk-shut").click();

    await vi.waitFor(() => expect(island.getAttribute("data-mk-inset")).toBe("false"));
    await vi.waitFor(() => expect(getComputedStyle(island).translate).toBe("none"));
  });
});

/** Developer detail is mostly there to answer "where is this written?". */
describe("the ring in developer detail", () => {
  it("puts the source line under the name, and nothing under it otherwise", async () => {
    point(await mark(1), true);
    await ring();
    expect(root().querySelector(".mk-ring-note")).toBeNull();

    for (const node of document.querySelectorAll("[data-maple-overlay]")) node.remove();
    history.replaceState({}, "", "?maple-detail=developer");
    await render(tree());

    point(await mark(1), true);
    await ring();
    await vi.waitFor(() =>
      expect(find(".mk-ring-note").textContent).toBe("app/dashboard/page.tsx:42:7"),
    );
  });
});
