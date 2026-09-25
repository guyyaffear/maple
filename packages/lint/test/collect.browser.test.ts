import { afterEach, describe, expect, it } from "vitest";

import { readPage } from "../src/rendered/collect.js";

import type { StyleRecord } from "../src/rendered/collect.js";

let container: HTMLElement;
let sheet: HTMLStyleElement | undefined;

function mount(html: string, css = ""): void {
  container = document.createElement("div");
  container.innerHTML = html;
  document.body.append(container);
  if (css === "") return;
  sheet = document.createElement("style");
  sheet.textContent = css;
  document.head.append(sheet);
}

function bySrc(src: string): StyleRecord {
  const found = readPage().records.find((record) => record.anchor.source === src);
  if (!found) throw new Error(`no record for ${src}`);
  return found;
}

afterEach(() => {
  container.remove();
  sheet?.remove();
  sheet = undefined;
});

describe("what is collected", () => {
  it("reads only tagged elements", () => {
    mount(`<p data-maple-src="a.tsx:1:1">tagged</p><p>untagged</p>`);
    expect(readPage().records).toHaveLength(1);
  });

  it("resolves computed values rather than the declared ones", () => {
    mount(
      `<div data-maple-src="a.tsx:1:1" class="target">Hi</div>`,
      `.target { color: #123456; font-size: 0.75rem; }`,
    );
    const record = bySrc("a.tsx:1:1");
    expect(record.color).toBe("rgb(18, 52, 86)");
    expect(record.fontSize).toBe(12);
  });

  it("gives a selector that finds the element again", () => {
    mount(`<section><span data-maple-src="a.tsx:1:1">x</span></section>`);
    expect(document.querySelector(bySrc("a.tsx:1:1").anchor.selector!)).toBe(
      container.querySelector("span"),
    );
  });

  it("prefers an id to a path, because an id survives a reorder", () => {
    mount(`<span id="save" data-maple-src="a.tsx:1:1">x</span>`);
    expect(bySrc("a.tsx:1:1").anchor.selector).toBe("#save");
  });
});

describe("the backdrop", () => {
  it("is the element's own background when it paints one", () => {
    mount(
      `<div data-maple-src="a.tsx:1:1" class="target">Hi</div>`,
      `.target { background: rgb(10, 20, 30); }`,
    );
    expect(bySrc("a.tsx:1:1").backdrop).toBe("rgb(10, 20, 30)");
  });

  it("climbs past a transparent element to what is actually behind it", () => {
    mount(
      `<div class="behind"><span data-maple-src="a.tsx:1:1">Hi</span></div>`,
      `.behind { background: rgb(10, 20, 30); }`,
    );
    const record = bySrc("a.tsx:1:1");
    expect(record.backgroundColor).toBe("rgba(0, 0, 0, 0)");
    expect(record.backdrop).toBe("rgb(10, 20, 30)");
  });
});

describe("what counts as interactive", () => {
  it.each([
    ["a button", `<button data-maple-src="a.tsx:1:1">x</button>`],
    ["a role", `<div role="button" data-maple-src="a.tsx:1:1">x</div>`],
    ["a tabindex", `<div tabindex="0" data-maple-src="a.tsx:1:1">x</div>`],
  ])("counts %s", (_what, html) => {
    mount(html);
    expect(bySrc("a.tsx:1:1").interactive).toBe(true);
  });

  it("does not count a plain div", () => {
    mount(`<div data-maple-src="a.tsx:1:1">x</div>`);
    expect(bySrc("a.tsx:1:1").interactive).toBe(false);
  });

  it("does not count a negative tabindex, which a pointer does not reach by tab", () => {
    mount(`<div tabindex="-1" data-maple-src="a.tsx:1:1">x</div>`);
    expect(bySrc("a.tsx:1:1").interactive).toBe(false);
  });
});

describe("motion", () => {
  it("reads the properties a running animation's keyframes declare", () => {
    mount(
      `<div data-maple-src="a.tsx:1:1" class="spin">x</div>`,
      `@keyframes grow { from { width: 0; opacity: 0; } to { width: 100px; opacity: 1; } }
       .spin { animation: grow 1s infinite; }`,
    );
    const record = bySrc("a.tsx:1:1");
    expect(record.animationDuration).toBe("1s");
    expect([...record.animationProperties].sort((a, b) => a.localeCompare(b))).toEqual([
      "opacity",
      "width",
    ]);
  });

  it("reports no properties when nothing is animating", () => {
    mount(`<div data-maple-src="a.tsx:1:1">x</div>`);
    expect(bySrc("a.tsx:1:1").animationProperties).toEqual([]);
  });
});
