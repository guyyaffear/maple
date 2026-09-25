import { describe, expect, it } from "vitest";

import {
  colorFindings,
  contrastFindings,
  motionPropertyFindings,
  reducedMotionFindings,
  renderedFindings,
  touchTargetFindings,
  typeScaleFindings,
} from "../src/rendered/rules.js";
import { parseTokens } from "../src/tokens.js";

import type { StyleRecord } from "../src/rendered/collect.js";

const TOKENS = parseTokens(`
:host {
  --mk-surface: #ffffff;
  --mk-ink: #111111;
  --mk-accent: rgb(0, 90, 200);
  --mk-text-sm: 13px;
  --mk-text-md: 16px;
}
`);

/** A record that no rule has anything to say about, for one field to be changed. */
const SELECTOR = "main:nth-of-type(1) > button:nth-of-type(1)";
const SOURCE = "src/app/page.tsx:10:4";

const BASE: StyleRecord = {
  anchor: { selector: SELECTOR },
  tag: "button",
  text: "Save",
  interactive: true,
  color: "#111111",
  backgroundColor: "#ffffff",
  backdrop: "#ffffff",
  fontSize: 16,
  fontWeight: 400,
  width: 120,
  height: 44,
  transitionProperty: "opacity",
  transitionDuration: "0.2s",
  animationName: "none",
  animationDuration: "0s",
  animationProperties: [],
};

/** The record as a tagged build produces it, which is the usual case. */
function record(over: Partial<StyleRecord> = {}): StyleRecord {
  return { ...BASE, anchor: { source: SOURCE, selector: SELECTOR }, ...over };
}

/** The same record from a build that never ran the tagger. */
function untagged(over: Partial<StyleRecord> = {}): StyleRecord {
  return { ...BASE, ...over };
}

describe("the clean record", () => {
  it("produces no findings at all", () => {
    expect(renderedFindings([record()], TOKENS)).toEqual([]);
  });

  it("anchors on the source rung when the tagger ran, and always on the selector", () => {
    const [found] = renderedFindings([record({ color: "#abcdef" })], TOKENS);
    expect(found!.anchor).toEqual({ source: SOURCE, selector: SELECTOR });
    expect(found!.tier).toBe("rendered");
  });

  it("falls back to the selector alone on an untagged build", () => {
    const [found] = renderedFindings([untagged({ color: "#abcdef" })], TOKENS);
    expect(found!.anchor.source).toBeUndefined();
    expect(found!.anchor.selector).toBe(SELECTOR);
  });
});

describe("maple/rendered-color-token", () => {
  it.each([
    ["text colour", { color: "#abcdef" }],
    ["background", { backgroundColor: "rgb(1, 2, 3)" }],
  ])("finds a raw %s", (_what, over) => {
    expect(colorFindings(record(over), TOKENS)).toHaveLength(1);
  });

  it("accepts a token written in another notation", () => {
    expect(colorFindings(record({ color: "rgb(17, 17, 17)" }), TOKENS)).toEqual([]);
  });

  it("says nothing about a fully transparent background", () => {
    expect(colorFindings(record({ backgroundColor: "rgba(0, 0, 0, 0)" }), TOKENS)).toEqual([]);
  });

  it("says nothing about a colour it cannot read", () => {
    expect(colorFindings(record({ color: "color(display-p3 1 0 0)" }), TOKENS)).toEqual([]);
  });

  it("names the value in the message", () => {
    expect(colorFindings(record({ color: "#abcdef" }), TOKENS)[0]!.message).toContain("#abcdef");
  });
});

describe("maple/rendered-type-scale", () => {
  it("finds a size off the scale", () => {
    expect(typeScaleFindings(record({ fontSize: 15 }), TOKENS)).toHaveLength(1);
  });

  it.each([13, 16])("accepts %spx, which the scale declares", (fontSize) => {
    expect(typeScaleFindings(record({ fontSize }), TOKENS)).toEqual([]);
  });

  it("says nothing when no type token was configured", () => {
    expect(
      typeScaleFindings(record({ fontSize: 15 }), parseTokens(":host { --mk-ink: #000; }")),
    ).toEqual([]);
  });
});

describe("maple/rendered-touch-target", () => {
  it.each([
    ["both axes", { width: 20, height: 20 }],
    ["one axis", { width: 120, height: 18 }],
  ])("finds one under 24px on %s", (_axis, over) => {
    expect(touchTargetFindings(record(over))).toHaveLength(1);
  });

  it("leaves a non-interactive element alone", () => {
    expect(touchTargetFindings(record({ interactive: false, width: 8, height: 8 }))).toEqual([]);
  });

  it("leaves a display:none element alone, which has no box to hit", () => {
    expect(touchTargetFindings(record({ width: 0, height: 0 }))).toEqual([]);
  });

  it("accepts exactly 24px", () => {
    expect(touchTargetFindings(record({ width: 24, height: 24 }))).toEqual([]);
  });
});

describe("maple/rendered-contrast", () => {
  it("finds grey on white", () => {
    expect(contrastFindings(record({ color: "#999999" }))).toHaveLength(1);
  });

  it("holds large text to the lower threshold", () => {
    const large = { color: "#949494", fontSize: 24 };
    expect(contrastFindings(record(large))).toEqual([]);
    expect(contrastFindings(record({ ...large, fontSize: 16 }))).toHaveLength(1);
  });

  it("treats bold 18.66px as large, as WCAG does", () => {
    expect(
      contrastFindings(record({ color: "#949494", fontSize: 18.66, fontWeight: 700 })),
    ).toEqual([]);
  });

  it("judges a translucent colour by what it composites to", () => {
    expect(contrastFindings(record({ color: "rgba(0, 0, 0, 0.3)" }))).toHaveLength(1);
  });

  it("says nothing about an element with no text", () => {
    expect(contrastFindings(record({ text: "", color: "#999999" }))).toEqual([]);
  });
});

describe("maple/rendered-motion-property", () => {
  it.each([
    ["a transition", { transitionProperty: "height", transitionDuration: "0.2s" }],
    ["the all shorthand", { transitionProperty: "all", transitionDuration: "0.2s" }],
    [
      "an animation",
      { animationName: "grow", animationDuration: "1s", animationProperties: ["width"] },
    ],
  ])("finds %s off the safe list", (_what, over) => {
    expect(motionPropertyFindings(record(over))).toHaveLength(1);
  });

  it.each(["opacity", "transform", "opacity, transform"])("accepts %s", (transitionProperty) => {
    expect(motionPropertyFindings(record({ transitionProperty }))).toEqual([]);
  });

  it("ignores a property named by a transition that never runs", () => {
    expect(
      motionPropertyFindings(record({ transitionProperty: "height", transitionDuration: "0s" })),
    ).toEqual([]);
  });

  it("names the offending property", () => {
    const found = motionPropertyFindings(record({ transitionProperty: "height" }));
    expect(found[0]!.message).toContain("height");
  });
});

describe("maple/rendered-reduced-motion", () => {
  it("finds motion that survives the query", () => {
    expect(reducedMotionFindings([record({ transitionDuration: "0.2s" })])).toHaveLength(1);
  });

  it("says nothing about a page that stops", () => {
    expect(
      reducedMotionFindings([record({ transitionDuration: "0s", animationDuration: "0s" })]),
    ).toEqual([]);
  });

  it("reads a duration list where only one entry still moves", () => {
    expect(reducedMotionFindings([record({ transitionDuration: "0s, 0.3s" })])).toHaveLength(1);
  });
});
