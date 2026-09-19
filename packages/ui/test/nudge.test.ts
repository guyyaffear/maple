import { describe, expect, it } from "vitest";

import { clampNudge, dragged, NUDGE_LIMIT_PX, NUDGE_THRESHOLD_PX } from "../src/marks/nudge.js";

/**
 * Far enough to clear what it covers, not far enough to end up beside
 * something it is not about. The offset is held for the session and never sent.
 */
describe("how far a mark may be moved", () => {
  it("leaves anything inside the limit alone", () => {
    expect(clampNudge({ dx: 40, dy: -30 })).toEqual({ dx: 40, dy: -30 });
  });

  it.each([
    ["right", { dx: NUDGE_LIMIT_PX + 500, dy: 0 }, { dx: NUDGE_LIMIT_PX, dy: 0 }],
    ["left", { dx: -NUDGE_LIMIT_PX - 500, dy: 0 }, { dx: -NUDGE_LIMIT_PX, dy: 0 }],
    ["down", { dx: 0, dy: NUDGE_LIMIT_PX + 1 }, { dx: 0, dy: NUDGE_LIMIT_PX }],
    ["up", { dx: 0, dy: -NUDGE_LIMIT_PX - 1 }, { dx: 0, dy: -NUDGE_LIMIT_PX }],
  ])("holds it back when it runs %s past the limit", (_way, given, expected) => {
    expect(clampNudge(given)).toEqual(expected);
  });
});

/** Under the threshold a pointer went down and up on a mark, which is a click. */
describe("what counts as a drag", () => {
  it.each([
    [{ dx: 0, dy: 0 }, false],
    [{ dx: NUDGE_THRESHOLD_PX - 1, dy: NUDGE_THRESHOLD_PX - 1 }, false],
    [{ dx: NUDGE_THRESHOLD_PX, dy: 0 }, true],
    [{ dx: 0, dy: -NUDGE_THRESHOLD_PX }, true],
  ])("%o", (travelled, expected) => {
    expect(dragged(travelled)).toBe(expected);
  });
});
