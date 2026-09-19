import { describe, expect, it } from "vitest";

import { pageIsTagged } from "../src/overlay/tagged.js";

/** Only the one method is reached, so the page is a stub rather than a DOM. */
function page(match: boolean): ParentNode {
  return { querySelector: (selector: string) => (match ? { selector } : null) } as ParentNode;
}

describe("asking a page whether the tagger ran", () => {
  it("is true when anything carries a source attribute", () => {
    expect(pageIsTagged(page(true))).toBe(true);
  });

  it("is false when nothing does, which is a build that never tagged", () => {
    expect(pageIsTagged(page(false))).toBe(false);
  });

  it("asks for the source attribute, not a name an application could have set", () => {
    let asked = "";
    const spy = {
      querySelector: (selector: string) => {
        asked = selector;
        return null;
      },
    } as ParentNode;

    pageIsTagged(spy);
    expect(asked).toBe("[data-maple-src]");
  });
});
