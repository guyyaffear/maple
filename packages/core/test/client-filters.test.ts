import { describe, expect, it } from "vitest";

import { matchesFilter, openCount, visibleComments } from "../src/client/index.js";
import { storedComment } from "../src/testing/fixtures.js";

import type { CommentFilter } from "../src/client/index.js";
import type { CommentStatus } from "../src/types.js";

function comment(id: string, status: CommentStatus) {
  return storedComment({ id, status });
}

const branch = [
  comment("c_open", "open"),
  comment("c_reverify", "needs_reverify"),
  comment("c_orphaned", "orphaned"),
  comment("c_resolved", "resolved"),
];

describe("what a filter shows", () => {
  const cases: Array<[CommentFilter, string[]]> = [
    ["all", ["c_open", "c_reverify", "c_orphaned"]],
    ["open", ["c_open"]],
    ["needs_reverify", ["c_reverify"]],
    ["unpinned", ["c_orphaned"]],
    ["resolved", ["c_resolved"]],
  ];

  it.each(cases)("%s shows %j with resolved hidden", (filter, expected) => {
    expect(visibleComments(branch, filter, false).map((found) => found.id)).toEqual(expected);
  });

  it("brings resolved back everywhere once the setting is on", () => {
    expect(visibleComments(branch, "all", true).map((found) => found.id)).toEqual([
      "c_open",
      "c_reverify",
      "c_orphaned",
      "c_resolved",
    ]);
  });

  it("shows the resolved filter without needing the setting", () => {
    expect(visibleComments(branch, "resolved", false)).toHaveLength(1);
  });

  it("matches a status without deciding whether resolved is hidden", () => {
    expect(matchesFilter(comment("c", "resolved"), "all")).toBe(true);
    expect(matchesFilter(comment("c", "open"), "unpinned")).toBe(false);
  });
});

describe("the pill's count", () => {
  it("is everything not resolved, unpinned included", () => {
    expect(openCount(branch)).toBe(3);
  });

  it("is zero on a branch where everything was resolved", () => {
    expect(openCount([comment("c_1", "resolved"), comment("c_2", "resolved")])).toBe(0);
  });
});
