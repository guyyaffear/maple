import { describe, expect, it } from "vitest";

import { colorKey, parseColor } from "../src/color.js";
import { lengthToPx, mergeTokens, parseTokens } from "../src/tokens.js";

const SHEET = `
:host {
  --mk-surface: #ffffff;
  --mk-ink: rgb(17, 17, 17);
  --mk-text-sm: 0.8125rem;
  --mk-text-md: 16px;
  --mk-space-2: 8px;
  --mk-radius-md: 6px;
  --mk-alias: var(--mk-ink);
}
`;

describe("lengthToPx", () => {
  it.each([
    ["16px", 16],
    ["1rem", 16],
    ["0.8125rem", 13],
    ["1.5em", 24],
    ["-2px", -2],
  ])("reads %s as %spx", (value, expected) => {
    expect(lengthToPx(value)).toBe(expected);
  });

  it.each(["16", "auto", "calc(1rem + 2px)", "50%"])("is undefined for %s", (value) => {
    expect(lengthToPx(value)).toBeUndefined();
  });

  it("honours a root font size that is not 16", () => {
    expect(lengthToPx("1rem", 20)).toBe(20);
  });
});

describe("parseTokens", () => {
  const tokens = parseTokens(SHEET);

  it("collects every declared colour", () => {
    expect(tokens.colors).toEqual(
      new Set([colorKey(parseColor("#ffffff")!), colorKey(parseColor("rgb(17,17,17)")!)]),
    );
  });

  it("takes only type tokens as the scale, not every length", () => {
    expect(tokens.fontSizes).toEqual(new Set([13, 16]));
  });

  it("records a name whose value is another var, but no value for it", () => {
    expect(tokens.names.get("--mk-alias")).toBe("var(--mk-ink)");
    expect(tokens.fontSizes.has(Number.NaN)).toBe(false);
  });

  it("reads a minified sheet, where nothing starts a line", () => {
    const minified = parseTokens(":host{--mk-ink:#000;--mk-text-sm:12px}");
    expect(minified.fontSizes).toEqual(new Set([12]));
    expect(minified.names.get("--mk-ink")).toBe("#000");
  });

  it("is empty for a sheet that declares nothing", () => {
    const empty = parseTokens("body { color: red; }");
    expect([empty.colors.size, empty.fontSizes.size, empty.names.size]).toEqual([0, 0, 0]);
  });
});

describe("mergeTokens", () => {
  it("adds a later file to an earlier one and lets it win a name", () => {
    const merged = mergeTokens([
      parseTokens(":host { --mk-ink: #000; --mk-text-sm: 12px; }"),
      parseTokens(":host { --mk-ink: #111; --mk-text-lg: 20px; }"),
    ]);
    expect(merged.fontSizes).toEqual(new Set([12, 20]));
    expect(merged.colors.size).toBe(2);
    expect(merged.names.get("--mk-ink")).toBe("#111");
  });
});
