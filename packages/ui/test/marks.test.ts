import { describe, expect, it } from "vitest";

import {
  COLLISION_GAP_PX,
  COLLISION_MAX_TRIES,
  COLLISION_STEP_PX,
  LEAF_OUTLINE,
  LEAF_ROTATION,
  LEAF_SOLID,
  LEAF_VIEW_BOX,
  MARK_HIT_PX,
  MARK_SIZE_PX,
  waterline,
} from "../src/marks/index.js";

describe("the leaf", () => {
  it("uses the rotated bounding box, or a 20-degree tilt clips the tips", () => {
    expect(LEAF_VIEW_BOX).toBe("-7 -7 78 78");
    expect(LEAF_ROTATION).toBe("rotate(20 32 32)");
  });

  it("gives the outline a counter, so it needs no stroke to read as a ring", () => {
    expect(LEAF_SOLID.match(/z/gi)).toHaveLength(1);
    expect(LEAF_OUTLINE.match(/z/gi)).toHaveLength(2);
  });
});

/** The clip sits outside the rotation, so the waterline stays horizontal. */
describe("the half-filled form", () => {
  it.each([
    [0.5, 39, 32],
    [0.55, 42.9, 28.1],
    [1, 78, -7],
    [0, 0, 71],
  ])("clips %d of the leaf", (fraction, height, top) => {
    const rect = waterline(fraction);
    expect(rect.height).toBeCloseTo(height, 5);
    expect(rect.y).toBeCloseTo(top, 5);
    expect(rect.x).toBe(-7);
    expect(rect.width).toBe(78);
  });

  it("clamps a fraction outside the leaf rather than drawing past it", () => {
    expect(waterline(2)).toEqual(waterline(1));
    expect(waterline(-1)).toEqual(waterline(0));
  });
});

describe("the collision resolver's numbers", () => {
  it("steps further than it tests, so two hit areas never overlap", () => {
    expect(COLLISION_STEP_PX).toBeGreaterThan(COLLISION_GAP_PX);
  });

  it("gives up after three, because a fourth is further than it is worth", () => {
    expect(COLLISION_MAX_TRIES).toBe(3);
  });

  it("hits larger than it draws", () => {
    expect(MARK_HIT_PX).toBeGreaterThanOrEqual(40);
    expect(MARK_HIT_PX).toBeGreaterThan(MARK_SIZE_PX);
  });
});
