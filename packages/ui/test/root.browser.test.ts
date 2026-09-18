import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { MapleRoot } from "../src/index.js";
import { SCHEME_ATTRIBUTE } from "../src/stylesheet.js";
import { offlineFetch } from "./offline.js";

import type { ReactElement } from "react";

const BRANCH = "feat/ui-scaffold";

/** The overlay's container, which is `:host` in the adopted stylesheet. */
function container(): HTMLElement {
  const found = document.querySelector<HTMLElement>("[data-maple-overlay]");
  if (!found) throw new Error("no overlay is mounted");
  return found;
}

function root(): ShadowRoot {
  const shadow = container().shadowRoot;
  if (!shadow) throw new Error("the overlay has no shadow root");
  return shadow;
}

function mount(): ReactElement {
  return createElement(MapleRoot, {
    branch: BRANCH,
    options: { fetch: offlineFetch() },
    className: "probe",
    children: createElement("div", { "data-testid": "child" }, "inside"),
  });
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.setAttribute("data-theme", "light");
});

afterEach(() => {
  document.documentElement.removeAttribute("data-theme");
  for (const overlay of document.querySelectorAll("[data-maple-overlay]")) overlay.remove();
});

/**
 * One shadow root, styled only by adoption. An injected <style> inside a
 * shadow root is still an inline style and still needs 'unsafe-inline'.
 */
describe("the overlay host", () => {
  it("mounts exactly one shadow root", async () => {
    await render(mount());

    await vi.waitFor(() =>
      expect(document.querySelectorAll("[data-maple-overlay]")).toHaveLength(1),
    );
    expect(root().mode).toBe("open");
  });

  it("adopts its stylesheet and injects no style element", async () => {
    await render(mount());

    await vi.waitFor(() => expect(root().adoptedStyleSheets.length).toBeGreaterThan(0));
    expect(root().adoptedStyleSheets).toHaveLength(1);
    expect(root().querySelector("style")).toBeNull();
    expect(root().querySelector("link")).toBeNull();
  });

  it("declares its tokens on :host rather than on anything it renders", async () => {
    await render(mount());

    await vi.waitFor(() => expect(root().adoptedStyleSheets).toHaveLength(1));
    const host = container();

    expect(getComputedStyle(host).getPropertyValue("--mk-accent").trim()).not.toBe("");
    expect(getComputedStyle(host).getPropertyValue("-webkit-font-smoothing")).toBe("antialiased");
    expect(host.getAttribute("style")).toContain("position: fixed");
  });

  it("renders its children into the shadow root, on a layer of its own", async () => {
    await render(mount());

    await vi.waitFor(() => expect(root().querySelector(".mk-layer")).not.toBeNull());
    const layer = root().querySelector(".mk-layer")!;

    expect(layer.className).toBe("mk-layer probe");
    expect(layer.querySelector("[data-testid='child']")?.textContent).toBe("inside");
  });
});

/**
 * The overlay's scheme is the opposite of the host's; the scheme a comment
 * records is the host's. Both come from the controller, never re-derived here.
 */
describe("the theme", () => {
  it("takes the opposite of a light host", async () => {
    await render(mount());

    await vi.waitFor(() => expect(container().getAttribute(SCHEME_ATTRIBUTE)).toBe("dark"));
  });

  it("takes the opposite of a dark host", async () => {
    document.documentElement.setAttribute("data-theme", "dark");
    await render(mount());

    await vi.waitFor(() => expect(container().getAttribute(SCHEME_ATTRIBUTE)).toBe("light"));
  });

  it("re-resolves when the host toggles mid-comment", async () => {
    await render(mount());
    await vi.waitFor(() => expect(container().getAttribute(SCHEME_ATTRIBUTE)).toBe("dark"));

    document.documentElement.setAttribute("data-theme", "dark");

    await vi.waitFor(() => expect(container().getAttribute(SCHEME_ATTRIBUTE)).toBe("light"));
  });

  it("repaints the tokens rather than only the attribute", async () => {
    await render(mount());
    await vi.waitFor(() => expect(container().getAttribute(SCHEME_ATTRIBUTE)).toBe("dark"));
    const dark = getComputedStyle(container()).getPropertyValue("--mk-bg").trim();

    document.documentElement.setAttribute("data-theme", "dark");

    await vi.waitFor(() => {
      expect(getComputedStyle(container()).getPropertyValue("--mk-bg").trim()).not.toBe(dark);
    });
  });

  it("honours an explicit scheme instead of the host's opposite", async () => {
    await render(
      createElement(MapleRoot, {
        branch: BRANCH,
        theme: "light",
        options: { fetch: offlineFetch() },
      }),
    );

    await vi.waitFor(() => expect(container().getAttribute(SCHEME_ATTRIBUTE)).toBe("light"));
  });
});

describe("reduced motion", () => {
  it("is a block the browser parsed, collapsing every duration to 100ms", async () => {
    await render(mount());
    await vi.waitFor(() => expect(root().adoptedStyleSheets).toHaveLength(1));

    const sheet = root().adoptedStyleSheets[0]!;
    const media = [...sheet.cssRules].find(
      (rule): rule is CSSMediaRule =>
        rule instanceof CSSMediaRule && rule.conditionText.includes("prefers-reduced-motion"),
    );

    expect(media).toBeDefined();
    const declared = (media!.cssRules[0] as CSSStyleRule).style;
    const durations = [...declared]
      .filter((name) => name.startsWith("--mk-dur"))
      .map((name) => Number.parseInt(declared.getPropertyValue(name), 10));

    expect(durations.length).toBeGreaterThan(0);
    for (const duration of durations) expect(duration).toBeLessThanOrEqual(100);
    expect(declared.getPropertyValue("--mk-rise-mark").trim()).toBe("0px");
  });
});
