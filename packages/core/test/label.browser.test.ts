import { afterEach, describe, expect, it } from "vitest";

import { labelFor } from "../src/anchor/index.js";

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
