import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { MapleRoot } from "../src/index.js";
import {
  Branch,
  Filters,
  Header,
  Island,
  IslandContent,
  IslandTrigger,
  Item,
  List,
  Logo,
  NewComment,
  PickButton,
  Settings,
} from "../src/island/index.js";
import { MarkLayer } from "../src/marks/index.js";
import { BRANCH, fixtureFetch, PAGE_HTML } from "./fixtures.js";

import type { MapleRootProps } from "../src/index.js";
import type { Comment } from "@maple-kit/core";
import type { ReactElement } from "react";

/** The island, the marks and the ring: the whole composition a link lands on. */
function mount(props: Partial<MapleRootProps> = {}): ReactElement {
  return createElement(
    MapleRoot,
    { branch: BRANCH, theme: "light", options: { fetch: fixtureFetch() }, ...props },
    createElement(MarkLayer),
    createElement(
      Island,
      null,
      createElement(IslandTrigger),
      createElement(
        IslandContent,
        null,
        createElement(
          Header,
          null,
          createElement(Logo),
          createElement(Branch, { branch: BRANCH }),
          createElement(Settings),
        ),
        createElement(Filters),
        createElement(List, {
          children: (comment: Comment) => createElement(Item, { comment }),
        }),
        createElement(
          NewComment,
          null,
          createElement(PickButton, { kind: "element" }),
          createElement(PickButton, { kind: "text" }),
        ),
      ),
    ),
  );
}

function overlay(): HTMLElement | null {
  return document.querySelector<HTMLElement>("[data-maple-overlay]");
}

function root(): ShadowRoot {
  const host = overlay();
  if (!host?.shadowRoot) throw new Error("no overlay is mounted");
  return host.shadowRoot;
}

function find<T extends Element>(selector: string): T {
  const found = root().querySelector<T>(selector);
  if (!found) throw new Error(`nothing matched ${selector}`);
  return found;
}

function all(selector: string): Element[] {
  return [...root().querySelectorAll(selector)];
}

function switchNamed(label: string): HTMLButtonElement {
  const row = all(".mk-setting").find((one) => one.textContent?.startsWith(label));
  const found = row?.querySelector<HTMLButtonElement>(".mk-switch");
  if (!found) throw new Error(`no setting reads ${label}`);
  return found;
}

/** Opens the island and waits for the rows the fixtures produce. */
async function open(): Promise<void> {
  await vi.waitFor(() => expect(find(".mk-pill").textContent).toContain("open"));
  find<HTMLButtonElement>(".mk-pill").click();
  await vi.waitFor(() => expect(all(".mk-row").length).toBeGreaterThan(0));
}

/** Turns developer detail on through the settings the island actually shows. */
async function developer(): Promise<void> {
  await open();
  find<HTMLButtonElement>('[aria-label="Settings"]').click();
  await vi.waitFor(() => expect(all(".mk-setting").length).toBeGreaterThan(0));
  switchNamed("Developer mode").click();
  await vi.waitFor(() => expect(all(".mk-chip-dev").length).toBeGreaterThan(0));
}

/**
 * The page the fixtures point at: enough of it resolves that a rung, a
 * confidence and a ring are all real rather than asserted against nothing.
 */
const ANCHORED_HTML = `
${PAGE_HTML}
<div data-maple-name="YieldCard" style="height: 60px">Yield</div>
<div id="settings-panel" style="height: 60px">Settings panel</div>
`;

/** A pointer gesture on the pill, in real events with real coordinates. */
function drag(from: [number, number], to: [number, number]): void {
  const pill = find<HTMLElement>(".mk-pill");
  const at = (type: string, [clientX, clientY]: [number, number]) =>
    pill.dispatchEvent(
      new PointerEvent(type, { clientX, clientY, pointerId: 1, bubbles: true, cancelable: true }),
    );

  at("pointerdown", from);
  at("pointermove", to);
  at("pointerup", to);
}

let search = "";

beforeEach(async () => {
  localStorage.clear();
  document.documentElement.setAttribute("data-theme", "light");
  const fixture = document.createElement("div");
  fixture.setAttribute("data-fixture-page", "");
  fixture.innerHTML = ANCHORED_HTML;
  document.body.append(fixture);
  history.replaceState({}, "", search === "" ? location.pathname : `?${search}`);
  await render(mount());
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
 * Nothing is recorded differently in either detail — the export fence carries
 * every field — which is exactly what makes defaulting to Default safe.
 */
describe("default detail", () => {
  it("names what a comment is on, and none of how it is found again", async () => {
    await open();
    const row = find(".mk-row");

    expect(row.textContent).toContain("on ");
    expect(row.querySelector(".mk-chip-dev")).toBeNull();
    expect(row.querySelector(".mk-path")).toBeNull();
  });

  it("says a row can be clicked, because clicking one opens the comment", async () => {
    await open();

    expect(getComputedStyle(find(".mk-row")).cursor).toBe("pointer");
  });
});

/** An outline follows the control's own corners, so nothing may force one. */
describe("the focus ring", () => {
  it("keeps a pill round when it takes focus", async () => {
    await open();
    const pill = find<HTMLButtonElement>(".mk-pill");
    pill.focus();

    expect(getComputedStyle(pill).borderTopLeftRadius).toBe("999px");
    expect(getComputedStyle(pill).outlineWidth).toBe("2px");
  });

  it("gives the two controls with no corners of their own a radius", async () => {
    await open();

    expect(getComputedStyle(find(".mk-when")).borderTopLeftRadius).not.toBe("0px");
  });
});

describe("developer detail", () => {
  /**
   * A row is the same object in both detentes. A box per fact made a row in
   * developer detail read as a different component from the row beside it.
   */
  it("leaves the row the shape it already was, with the facts as a footnote", async () => {
    await developer();
    const fact = find<HTMLElement>(".mk-chip-dev");
    const style = getComputedStyle(fact);

    expect(style.borderTopWidth).toBe("0px");
    expect(style.backgroundColor).toBe("rgba(0, 0, 0, 0)");
    expect(style.color).toBe(getComputedStyle(find(".mk-row")).getPropertyValue("--mk-faint"));
  });

  it("keeps a path on one line, however long the selector it recorded is", async () => {
    await developer();
    const path = find<HTMLElement>(".mk-path");

    expect(getComputedStyle(path).whiteSpace).toBe("nowrap");
    expect(getComputedStyle(path).textOverflow).toBe("ellipsis");
  });

  it("puts the rung's number on a chip and its sentence in a tooltip", async () => {
    await developer();
    const chip = all(".mk-chip-dev").find((one) => one.textContent?.includes("%") === true);
    const tip = chip?.querySelector(".mk-tip");

    expect(chip?.childNodes[0]).toBeInstanceOf(SVGElement);
    expect(tip?.textContent).toMatch(/^Found again by the /);
    expect(tip?.textContent).toContain("After a redeploy Maple re-finds this element that way");
    expect(tip?.textContent).not.toContain("confidence:");
  });

  it("carries the source line and the CSS path as values, never as field names", async () => {
    await developer();
    const paths = all(".mk-path").map((one) => one.textContent);

    expect(paths.some((path) => path?.includes(".tsx:"))).toBe(true);
    expect(
      all(".mk-chip-dev")
        .map((one) => one.textContent)
        .join(" "),
    ).not.toContain("selector:");
  });

  it("appends the rungs an unpinned comment tried to its tooltip", async () => {
    await developer();
    const tips = all(".mk-meta .mk-chip-lost .mk-tip").map((one) => one.textContent);

    expect(tips.some((text) => text?.includes("Tried: "))).toBe(true);
    expect(tips.some((text) => text?.includes("the component name"))).toBe(true);
  });

  it("waits 80ms before a tooltip appears, and never before it goes", async () => {
    await developer();
    const chip = find<HTMLElement>(".mk-chip-dev");
    const tip = find<HTMLElement>(".mk-chip-dev .mk-tip");

    expect(getComputedStyle(tip).transitionDelay).toBe("0s, 0s");
    expect(getComputedStyle(tip).transitionDuration).toBe("0.15s, 0.15s");
    expect(getComputedStyle(tip).transitionTimingFunction).toBe("ease-out, ease-out");
    expect(getComputedStyle(tip).opacity).toBe("0");

    chip.focus();
    await vi.waitFor(() => expect(getComputedStyle(tip).transitionDelay).toBe("0.08s"));
    chip.blur();
    await vi.waitFor(() => expect(getComputedStyle(tip).transitionDelay).toBe("0s, 0s"));
  });
});

describe("the island's corner", () => {
  it("starts bottom-right and snaps to the corner a drag lets it go in", async () => {
    await vi.waitFor(() =>
      expect(find(".mk-island").getAttribute("data-mk-corner")).toBe("bottom-right"),
    );
    const island = find<HTMLElement>(".mk-island");
    const start = island.getBoundingClientRect();

    drag([start.x + start.width / 2, start.y + start.height / 2], [90, 60]);
    await vi.waitFor(() => expect(island.getAttribute("data-mk-corner")).toBe("top-left"));
    expect(island.hasAttribute("data-mk-dragging")).toBe(false);
    expect(island.style.getPropertyValue("--mk-x")).toBe("");
  });

  it("remembers the corner, per origin, for the next page that mounts", async () => {
    const island = find<HTMLElement>(".mk-island");
    const start = island.getBoundingClientRect();

    drag([start.x + start.width / 2, start.y + start.height / 2], [90, 60]);
    await vi.waitFor(() => expect(island.getAttribute("data-mk-corner")).toBe("top-left"));

    const stored = localStorage.getItem(`maple:prefs:${location.origin}`);
    expect(JSON.parse(stored ?? "{}")).toMatchObject({ position: "top-left" });
  });

  it("does not open the island on the click that ends a drag", () => {
    const island = find<HTMLElement>(".mk-island");
    const start = island.getBoundingClientRect();

    drag([start.x + start.width / 2, start.y + start.height / 2], [90, 60]);
    find<HTMLButtonElement>(".mk-pill").click();

    expect(root().querySelector(".mk-card")).toBeNull();
  });
});

describe("hidden for the session", () => {
  it("takes the island off the page and leaves the overlay mounted under it", async () => {
    await open();
    find<HTMLButtonElement>('[aria-label="Settings"]').click();
    await vi.waitFor(() => expect(all(".mk-setting").length).toBeGreaterThan(0));
    const hide = all(".mk-setting").find((one) => one.textContent?.startsWith("Hide the island"));
    hide?.querySelector<HTMLButtonElement>(".mk-more")?.click();

    await vi.waitFor(() => expect(root().querySelector(".mk-island")).toBeNull());
    expect(overlay()).not.toBeNull();
  });
});

/** The link a pull-request comment carries, and what it has to land on. */
describe("the query string", () => {
  it("mounts nothing at all for ?maple=off", async () => {
    for (const node of document.querySelectorAll("[data-maple-overlay]")) node.remove();
    history.replaceState({}, "", "?maple=off");
    await render(mount());

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(overlay()).toBeNull();
  });

  it("opens the island on the comment a link names, and draws its ring", async () => {
    for (const node of document.querySelectorAll("[data-maple-overlay]")) node.remove();
    history.replaceState({}, "", "?maple-comment=c5&maple-pos=top-left");
    await render(mount());

    await vi.waitFor(() => expect(root().querySelector(".mk-card")).not.toBeNull());
    await vi.waitFor(() =>
      expect(find(".mk-row[data-mk-selected='true']")).toBeInstanceOf(HTMLElement),
    );
    expect(find(".mk-island").getAttribute("data-mk-corner")).toBe("top-left");
    await vi.waitFor(() => expect(find(".mk-ring").getAttribute("data-mk-off")).not.toBe("true"));
  });

  it("opens in developer detail when the link asks for it", async () => {
    for (const node of document.querySelectorAll("[data-maple-overlay]")) node.remove();
    history.replaceState({}, "", "?maple-detail=developer");
    await render(mount());

    await open();
    expect(all(".mk-chip-dev").length).toBeGreaterThan(0);
  });

  it("arms the pick a link asks for, without anything being pressed", async () => {
    for (const node of document.querySelectorAll("[data-maple-overlay]")) node.remove();
    history.replaceState({}, "", "?maple-new=text");
    await render(mount());

    await vi.waitFor(() => expect(find(".mk-pill").getAttribute("data-armed")).toBe("true"));
  });
});
