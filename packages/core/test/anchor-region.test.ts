import { describe, expect, it } from "vitest";

import { kindOf } from "../src/anchor/kind.js";
import { regionBox, regionOf } from "../src/anchor/region.js";
import { holds } from "../src/overlay/pick.js";

import type { RegionBox } from "../src/anchor/region.js";

/** A container 200 wide and 100 tall, offset so a bare fraction cannot pass. */
const CONTAINER: RegionBox = { x: 40, y: 20, width: 200, height: 100 };

/** A container the page has collapsed, which is the divide-by-zero case. */
const ZERO = { width: 0, height: 0 };

describe("recording a rectangle", () => {
  it("measures it as fractions of the box it was drawn inside", () => {
    const drawn = { x: 60, y: 30, width: 100, height: 50 };

    expect(regionOf(drawn, CONTAINER)).toEqual({ x: 0.1, y: 0.1, width: 0.5, height: 0.5 });
  });

  /** A container with no area would divide by zero, which is a NaN anchor. */
  it("survives a container with no width or height", () => {
    const region = regionOf({ x: 0, y: 0, width: 4, height: 4 }, { x: 0, y: 0, ...ZERO });

    expect(Number.isFinite(region.width)).toBe(true);
    expect(Number.isFinite(region.height)).toBe(true);
  });

  it("keeps a rectangle that reaches past its container, rather than clamping it", () => {
    const drawn = { x: 20, y: 10, width: 260, height: 130 };
    const region = regionOf(drawn, CONTAINER);

    expect(region.x).toBeLessThan(0);
    expect(region.width).toBeGreaterThan(1);
  });
});

/**
 * The whole point of fractions: the same rectangle comes back over a container
 * the page has since laid out at another size and in another place.
 */
describe("placing it again", () => {
  it("gives back what was drawn when nothing moved", () => {
    const drawn = { x: 60, y: 30, width: 100, height: 50 };

    expect(regionBox(CONTAINER, regionOf(drawn, CONTAINER))).toEqual(drawn);
  });

  it("moves and scales with the container rather than staying in pixels", () => {
    const region = regionOf({ x: 60, y: 30, width: 100, height: 50 }, CONTAINER);
    const moved = regionBox({ x: 0, y: 0, width: 400, height: 200 }, region);

    expect(moved).toEqual({ x: 40, y: 20, width: 200, height: 100 });
  });
});

describe("what holds what", () => {
  it.each([
    ["the same box", { x: 0, y: 0, width: 10, height: 10 }, true],
    ["a box inside it", { x: 2, y: 2, width: 4, height: 4 }, true],
    ["a box over its right edge", { x: 8, y: 2, width: 4, height: 4 }, false],
    ["a box over its top edge", { x: 2, y: -1, width: 4, height: 4 }, false],
  ])("%s", (_what, inner, expected) => {
    expect(holds({ x: 0, y: 0, width: 10, height: 10 }, inner)).toBe(expected);
  });
});

/**
 * Three surfaces used to answer this separately, which is two chances to
 * disagree about what a comment is.
 */
describe("which pick an anchor remembers", () => {
  it.each([
    ["element", { key: "kpi" }],
    ["text", { quote: { exact: "churn" } }],
    ["region", { selector: ".split", region: { x: 0.1, y: 0.1, width: 0.5, height: 0.5 } }],
  ])("reads %s back off the anchor", (kind, anchor) => {
    expect(kindOf(anchor)).toBe(kind);
  });

  it("lets a region outrank the quote its container happened to carry", () => {
    const anchor = {
      quote: { exact: "Reviews merged" },
      region: { x: 0, y: 0, width: 1, height: 1 },
    };

    expect(kindOf(anchor)).toBe("region");
  });
});
