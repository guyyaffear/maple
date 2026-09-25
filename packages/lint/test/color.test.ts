import { describe, expect, it } from "vitest";

import {
  colorKey,
  contrastRatio,
  isUnreadableColor,
  over,
  parseColor,
  relativeLuminance,
} from "../src/color.js";

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

  it.each([
    ["hsl(220 70% 50%)", { r: 38, g: 98, b: 217, a: 1 }],
    ["hsl(220, 70%, 50%)", { r: 38, g: 98, b: 217, a: 1 }],
    ["hsl(220deg 70% 50%)", { r: 38, g: 98, b: 217, a: 1 }],
    ["hsla(220, 70%, 50%, 0.5)", { r: 38, g: 98, b: 217, a: 0.5 }],
    ["hsl(220 70% 50% / 0.5)", { r: 38, g: 98, b: 217, a: 0.5 }],
    ["hsl(0 0% 0%)", { r: 0, g: 0, b: 0, a: 1 }],
    ["hsl(0 0% 100%)", { r: 255, g: 255, b: 255, a: 1 }],
  ])("reads %s, which a token file may declare", (value, expected) => {
    const found = parseColor(value)!;
    expect(Math.round(found.r)).toBe(expected.r);
    expect(Math.round(found.g)).toBe(expected.g);
    expect(Math.round(found.b)).toBe(expected.b);
    expect(found.a).toBeCloseTo(expected.a, 3);
  });

  it.each([
    ["turn", "hsl(0.611turn 70% 50%)"],
    ["grad", "hsl(244.4grad 70% 50%)"],
    ["rad", "hsl(3.84rad 70% 50%)"],
  ])("reads a hue in %s", (_unit, value) => {
    const found = parseColor(value)!;
    expect(Math.round(found.r)).toBeCloseTo(38, -1);
    expect(Math.round(found.b)).toBeCloseTo(217, -1);
  });

  it("wraps a hue past 360 the way CSS does", () => {
    expect(parseColor("hsl(580 70% 50%)")).toEqual(parseColor("hsl(220 70% 50%)"));
  });

  it("reads color(srgb …), which is what color-mix() computes to", () => {
    expect(parseColor("color(srgb 0.5 0 0.5)")).toEqual({ r: 127.5, g: 0, b: 127.5, a: 1 });
  });

  it("keys the same as what Chromium computes that hsl() to, which is what matches a token", () => {
    expect(colorKey(parseColor("hsl(220 70% 50%)")!)).toBe(
      colorKey(parseColor("rgb(38, 98, 217)")!),
    );
  });

  it.each([
    ["rebeccapurple", { r: 102, g: 51, b: 153, a: 1 }],
    ["black", { r: 0, g: 0, b: 0, a: 1 }],
    ["REBECCAPURPLE", { r: 102, g: 51, b: 153, a: 1 }],
    ["transparent", { r: 0, g: 0, b: 0, a: 0 }],
  ])("reads the named colour %s", (value, expected) => {
    expect(parseColor(value)).toEqual(expected);
  });

  it.each([
    ["#11223344", { r: 17, g: 34, b: 51, a: 68 / 255 }],
    ["#abcd", { r: 170, g: 187, b: 204, a: 221 / 255 }],
  ])("reads hex with alpha: %s", (value, expected) => {
    expect(parseColor(value)).toEqual(expected);
  });

  it.each(["color(display-p3 1 0 0)", "oklch(0.7 0.1 220)", "", "rgb(1, 2)", "not a colour"])(
    "says nothing about %s rather than guessing",
    (value) => {
      expect(parseColor(value)).toBeUndefined();
    },
  );
});

describe("isUnreadableColor", () => {
  it.each(["oklch(0.7 0.1 220)", "color(display-p3 1 0 0)", "lab(50% 40 59)", "#gg0000"])(
    "flags %s, which was meant to be a colour and could not be read",
    (value) => {
      expect(isUnreadableColor(value)).toBe(true);
    },
  );

  it.each(["#abc", "rgb(1, 2, 3)", "hsl(220 70% 50%)", "rebeccapurple", "transparent"])(
    "says nothing about %s, which reads fine",
    (value) => {
      expect(isUnreadableColor(value)).toBe(false);
    },
  );

  it.each(["1px solid", "14px", "auto", "var(--unresolved)", ""])(
    "says nothing about %s, which was never a colour",
    (value) => {
      expect(isUnreadableColor(value)).toBe(false);
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
