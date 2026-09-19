import { afterEach, describe, expect, it } from "vitest";

import { labelFor, sourceFor } from "../src/anchor/index.js";

let container: HTMLElement;

function mount(html: string): HTMLElement {
  container = document.createElement("div");
  container.innerHTML = html;
  document.body.append(container);
  return container;
}

afterEach(() => container.remove());

describe("naming the thing a comment is on", () => {
  const cases: ReadonlyArray<readonly [string, string, string | undefined]> = [
    [
      "reads the label the application wrote",
      `<section data-maple-label="the Yield card"><b>Inner</b></section>`,
      "the Yield card",
    ],
    [
      "walks up to the nearest ancestor that carries one",
      `<section data-maple-label="the Yield card"><p><b>Inner</b></p></section>`,
      "the Yield card",
    ],
    [
      "prefers the nearest label over a further one",
      `<section data-maple-label="the page"><p data-maple-label="the row"><b>Inner</b></p></section>`,
      "the row",
    ],
    [
      "prefers a written label over the component's name",
      `<section data-maple-name="YieldCard" data-maple-label="the yield summary"><b>Inner</b></section>`,
      "the yield summary",
    ],
    [
      "falls back to the component name the tagger wrote",
      `<section data-maple-name="YieldCard"><b>Inner</b></section>`,
      "Yield card",
    ],
    [
      "treats a blank label as unsaid",
      `<section data-maple-name="YieldCard"><b data-maple-label=" "></b></section>`,
      "Yield card",
    ],
    ["says nothing when the page names nothing", `<section><b>Inner</b></section>`, undefined],
  ];

  it.each(cases)("%s", (_case, html, expected) => {
    const root = mount(html);
    expect(labelFor({ element: root.querySelector("b") })).toBe(expected);
  });

  it("prefers what the page says now over what the anchor recorded", () => {
    const root = mount(`<section data-maple-label="the Yield card"><b>Inner</b></section>`);
    const element = root.querySelector("b");
    expect(labelFor({ element, anchor: { component: "RetentionPanel" } })).toBe("the Yield card");
  });

  it("uses the recorded component name when the page carries no name", () => {
    const root = mount(`<section><b>Inner</b></section>`);
    const element = root.querySelector("b");
    expect(labelFor({ element, anchor: { component: "RetentionPanel" } })).toBe("Retention panel");
  });
});

/**
 * The line a reader goes to next. The page wins over the anchor: a redeploy
 * since the comment was written has moved what the anchor recorded.
 */
describe("saying where the thing is written", () => {
  const HERE = "app/dashboard/page.tsx:42:7";
  const RECORDED = "app/dashboard/page.tsx:18:3";

  it("reads the attribute the tagger wrote, from the nearest ancestor", () => {
    const root = mount(`<section data-maple-src="${HERE}"><p><b>Inner</b></p></section>`);
    expect(sourceFor({ element: root.querySelector("b") })).toBe(HERE);
  });

  it("prefers where the page says it is now over where the anchor recorded it", () => {
    const root = mount(`<section data-maple-src="${HERE}"><b>Inner</b></section>`);
    const element = root.querySelector("b");
    expect(sourceFor({ element, anchor: { source: RECORDED } })).toBe(HERE);
  });

  it("falls back to the anchor when the page ran no tagger", () => {
    const root = mount(`<section><b>Inner</b></section>`);
    const element = root.querySelector("b");
    expect(sourceFor({ element, anchor: { source: RECORDED } })).toBe(RECORDED);
  });

  it("says nothing when neither the page nor the anchor knows", () => {
    const root = mount(`<section><b>Inner</b></section>`);
    expect(sourceFor({ element: root.querySelector("b") })).toBeUndefined();
  });
});
