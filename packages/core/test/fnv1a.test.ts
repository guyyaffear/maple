import { describe, expect, it } from "vitest";

import { fnv1a32 } from "../src/lib/fnv1a.js";

const VECTORS: readonly (readonly [string, number])[] = [
  ["", 0x811c9dc5],
  ["a", 0xe40c292c],
  ["b", 0xe70c2de5],
  ["foobar", 0xbf9cf968],
  ["hello world", 0xd58b3fa7],
];

describe("fnv1a32", () => {
  it.each(VECTORS)("hashes %j to the published vector", (value, expected) => {
    expect(fnv1a32(value)).toBe(expected);
  });

  it("hashes UTF-8 bytes, not UTF-16 code units", () => {
    expect(fnv1a32("ünïcødé")).toBe(0x5b9027a0);
  });

  it("stays inside an unsigned 32-bit integer", () => {
    for (const value of ["", "a", "u_7", "ünïcødé", "x".repeat(1000)]) {
      const hash = fnv1a32(value);

      expect(Number.isInteger(hash)).toBe(true);
      expect(hash).toBeGreaterThanOrEqual(0);
      expect(hash).toBeLessThanOrEqual(0xffffffff);
    }
  });

  it("returns the same value every time it is called", () => {
    expect(fnv1a32("u_7")).toBe(fnv1a32("u_7"));
  });

  it("separates ids that differ only in their last character", () => {
    expect(fnv1a32("u_10")).not.toBe(fnv1a32("u_11"));
  });
});
