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

  it("keeps a name's declared value, var() and all", () => {
    expect(tokens.names.get("--mk-alias")).toBe("var(--mk-ink)");
  });

  it("reads an hsl token, which a computed style would never show as hsl", () => {
    const themed = parseTokens(":host { --brand: hsl(220 70% 50%); }");
    expect(themed.colors).toEqual(new Set([colorKey(parseColor("rgb(38, 98, 217)")!)]));
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

describe("var() indirection", () => {
  it("contributes the colour an alias resolves to, which is what an element computes to", () => {
    const aliased = parseTokens(":host { --grey-100: #eeeeee; --surface: var(--grey-100); }");
    expect(aliased.colors).toEqual(new Set([colorKey(parseColor("#eeeeee")!)]));
  });

  it("follows a chain of aliases", () => {
    const chained = parseTokens(":host { --a: #123456; --b: var(--a); --c: var(--b); }");
    expect(chained.colors.size).toBe(1);
    expect(chained.colors).toEqual(new Set([colorKey(parseColor("#123456")!)]));
  });

  it("takes the fallback when the name is not declared", () => {
    const missing = parseTokens(":host { --surface: var(--nowhere, #abcdef); }");
    expect(missing.colors).toEqual(new Set([colorKey(parseColor("#abcdef")!)]));
  });

  it("gives up on a cycle rather than following it forever", () => {
    const cyclic = parseTokens(":host { --a: var(--b); --b: var(--a); }");
    expect(cyclic.colors.size).toBe(0);
  });

  it("resolves a type token through an alias too", () => {
    const aliased = parseTokens(":host { --scale-2: 13px; --text-sm: var(--scale-2); }");
    expect(aliased.fontSizes).toEqual(new Set([13]));
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
