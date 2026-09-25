import { describe, expect, it } from "vitest";

import { colorKey, contrastRatio, over, parseColor, relativeLuminance } from "../src/color.js";

describe("parseColor", () => {
  it.each([
    ["#fff", { r: 255, g: 255, b: 255, a: 1 }],
    ["#1a2b3c", { r: 26, g: 43, b: 60, a: 1 }],
    ["rgb(10, 20, 30)", { r: 10, g: 20, b: 30, a: 1 }],
    ["rgb(10 20 30)", { r: 10, g: 20, b: 30, a: 1 }],
    ["rgba(10, 20, 30, 0.5)", { r: 10, g: 20, b: 30, a: 0.5 }],
    ["rgb(10 20 30 / 0.25)", { r: 10, g: 20, b: 30, a: 0.25 }],
    ["  #ABC  ", { r: 170, g: 187, b: 204, a: 1 }],
  ])("reads %s", (value, expected) => {
    expect(parseColor(value)).toEqual(expected);
  });

  it.each(["rebeccapurple", "color(display-p3 1 0 0)", "", "rgb(1, 2)", "not a colour"])(
    "says nothing about %s rather than guessing",
    (value) => {
      expect(parseColor(value)).toBeUndefined();
    },
  );
});

describe("colorKey", () => {
  it("gives two spellings of one colour the same key", () => {
    expect(colorKey(parseColor("#1a2b3c")!)).toBe(colorKey(parseColor("rgb(26, 43, 60)")!));
  });

  it("separates colours that differ only in alpha", () => {
    expect(colorKey(parseColor("rgba(0,0,0,0.5)")!)).not.toBe(colorKey(parseColor("#000")!));
  });
});

describe("relativeLuminance", () => {
  it.each([
    ["#000", 0],
    ["#fff", 1],
  ])("is %s for %s", (value, expected) => {
    expect(relativeLuminance(parseColor(value)!)).toBeCloseTo(expected, 5);
  });
});

describe("contrastRatio", () => {
  it("is 21:1 between black and white, whichever way round", () => {
    const black = parseColor("#000")!;
    const white = parseColor("#fff")!;
    expect(contrastRatio(black, white)).toBeCloseTo(21, 5);
    expect(contrastRatio(white, black)).toBeCloseTo(21, 5);
  });

  it("is 1:1 for a colour against itself", () => {
    expect(contrastRatio(parseColor("#777")!, parseColor("#777")!)).toBeCloseTo(1, 5);
  });

  it.each([
    ["#767676", 4.54],
    ["#949494", 3.03],
  ])("reads %s on white as the published value", (value, expected) => {
    expect(contrastRatio(parseColor(value)!, parseColor("#fff")!)).toBeCloseTo(expected, 1);
  });
});

describe("over", () => {
  it("composites half-transparent black on white to the midpoint", () => {
    expect(over(parseColor("rgba(0,0,0,0.5)")!, parseColor("#fff")!)).toEqual({
      r: 127.5,
      g: 127.5,
      b: 127.5,
      a: 1,
    });
  });

  it("leaves an opaque colour alone", () => {
    const red = parseColor("#ff0000")!;
    expect(over(red, parseColor("#fff")!)).toEqual(red);
  });
});
