import { kindOf } from "@maple-kit/core/anchor";
import { describe, expect, it } from "vitest";

import { seedComments } from "../../../examples/vite-app/src/app/seed.js";

import type { CommentStatus, IdentityProvenance, MediaRef, PickKind } from "@maple-kit/core";

/**
 * The example shows the whole vocabulary before anything is clicked, so what it
 * seeds is asserted: a state nothing renders is a state nothing checks.
 */
const SHOTS: readonly MediaRef[] = [
  { connector: "memory", key: "shot-1", contentType: "image/svg+xml" },
  { connector: "memory", key: "shot-2", contentType: "image/svg+xml" },
];

const SEEDED = seedComments("feat/example", SHOTS);

function count<T>(values: readonly T[]): ReadonlyMap<T, number> {
  const tally = new Map<T, number>();
  for (const value of values) tally.set(value, (tally.get(value) ?? 0) + 1);
  return tally;
}

describe("what the example starts with", () => {
  it("seeds eleven, which is enough for every state and not a wall of rows", () => {
    expect(SEEDED).toHaveLength(11);
  });

  it("covers all four statuses, with two that lost their place", () => {
    const statuses = count(SEEDED.map((one) => one.status ?? "open"));

    expect([...statuses.keys()].sort((a, b) => a.localeCompare(b))).toEqual<CommentStatus[]>([
      "needs_reverify",
      "open",
      "orphaned",
      "resolved",
    ]);
    expect(statuses.get("orphaned")).toBe(2);
  });

  it("covers all three provenances, so every leaf fill is on the page", () => {
    const seen = new Set(SEEDED.map((one) => one.author.provenance));

    expect([...seen].sort((a, b) => a.localeCompare(b))).toEqual<IdentityProvenance[]>([
      "client",
      "guest",
      "server",
    ]);
  });

  it("covers all three picks, region included", () => {
    const kinds = count(SEEDED.map((one) => kindOf(one.anchor)));

    expect([...kinds.keys()].sort((a, b) => a.localeCompare(b))).toEqual<PickKind[]>([
      "element",
      "region",
      "text",
    ]);
    expect(kinds.get("region")).toBeGreaterThanOrEqual(2);
  });

  /** The strip says who put the image there, and only Maple's say `capture`. */
  it("carries screenshots Maple took by itself", () => {
    const shots = SEEDED.flatMap((one) => one.attachments ?? []);

    expect(shots.length).toBeGreaterThanOrEqual(2);
    expect(shots.every((shot) => shot.source === "capture")).toBe(true);
  });

  it("gives a region its rectangle, in fractions the layout can move", () => {
    const regions = SEEDED.map((one) => one.anchor.region).filter(Boolean);

    expect(regions.length).toBeGreaterThanOrEqual(2);
    for (const region of regions) {
      expect(region!.width).toBeGreaterThan(0);
      expect(region!.width).toBeLessThanOrEqual(1);
      expect(region!.height).toBeGreaterThan(0);
      expect(region!.height).toBeLessThanOrEqual(1);
    }
  });

  it("leaves one anchor with nothing above a CSS path, so a weak one is drawn", () => {
    const weak = SEEDED.filter(
      (one) =>
        one.anchor.key === undefined &&
        one.anchor.source === undefined &&
        one.anchor.component === undefined,
    );

    expect(weak.length).toBeGreaterThanOrEqual(1);
  });

  it("belongs to the branch it was asked for, every one of them", () => {
    expect(SEEDED.every((one) => one.branch === "feat/example")).toBe(true);
    expect(SEEDED.every((one) => one.context.url.length > 0)).toBe(true);
  });
});
