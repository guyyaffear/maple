/**
 * Colour parsing and WCAG contrast, implemented here rather than taken from a
 * package.
 *
 * Three functions are needed and the formulas are published, so this follows
 * the dependency rule in CLAUDE.md. Relative luminance and the contrast ratio
 * are from WCAG 2.1, https://www.w3.org/TR/WCAG21/#dfn-relative-luminance and
 * #dfn-contrast-ratio.
 */

/** A colour in sRGB, each channel 0-255, alpha 0-1. */
export interface Rgb {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly a: number;
}

const HEX_SHORT = /^#([\da-f])([\da-f])([\da-f])$/i;
const HEX_LONG = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i;
const FUNCTIONAL = /^rgba?\(([^)]+)\)$/i;
const HSL = /^hsla?\(([^)]+)\)$/i;
const SRGB = /^color\(\s?srgb\s([^)]+)\)$/i;
const TURNS: Readonly<Record<string, number>> = {
  deg: 1,
  grad: 0.9,
  rad: 180 / Math.PI,
  turn: 360,
};

/** Reads one `rgb()` argument, which may be a percentage. */
function channel(part: string, scale: number): number {
  const text = part.trim();
  const value = Number.parseFloat(text);
  if (Number.isNaN(value)) return Number.NaN;
  return text.endsWith("%") ? (value / 100) * scale : value;
}

/** Hex, in both lengths. */
function parseHex(text: string): Rgb | undefined {
  const short = HEX_SHORT.exec(text);
  if (short) {
    const [r, g, b] = short.slice(1, 4).map((part) => Number.parseInt(part + part, 16));
    return { r: r!, g: g!, b: b!, a: 1 };
  }
  const long = HEX_LONG.exec(text);
  if (!long) return undefined;
  const [r, g, b] = long.slice(1, 4).map((part) => Number.parseInt(part, 16));
  return { r: r!, g: g!, b: b!, a: 1 };
}

/** Splits a colour function's arguments into its channels and its alpha. */
function argumentsOf(body: string): { parts: string[]; alpha: string | undefined } {
  const [channels, slashed] = body.split("/");
  const parts = channels!
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean);
  return { parts, alpha: slashed ?? parts[3] };
}

/** `rgb()` and `rgba()`, in both the comma and the space spelling. */
function parseFunctional(text: string): Rgb | undefined {
  const call = FUNCTIONAL.exec(text);
  if (!call) return undefined;
  const { parts, alpha } = argumentsOf(call[1]!);
  if (parts.length < 3) return undefined;
  const [r, g, b] = parts.map((part) => channel(part, 255));
  const a = channel(alpha ?? "1", 1);
  if ([r, g, b, a].some((value) => Number.isNaN(value))) return undefined;
  return { r: r!, g: g!, b: b!, a: a };
}

/** A hue in any of the four angle units CSS allows, as degrees. */
function hue(part: string): number {
  const text = part.trim();
  const value = Number.parseFloat(text);
  if (Number.isNaN(value)) return Number.NaN;
  const lower = text.toLowerCase();
  const unit = Object.entries(TURNS).find(([name]) => lower.endsWith(name));
  return value * (unit === undefined ? 1 : unit[1]);
}

/** The conversion from CSS Color 4, section 7. */
function fromHsl(degrees: number, saturation: number, lightness: number): Omit<Rgb, "a"> {
  const turned = ((degrees % 360) + 360) % 360;
  const reach = saturation * Math.min(lightness, 1 - lightness);
  const at = (offset: number): number => {
    const k = (offset + turned / 30) % 12;
    return (lightness - reach * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255;
  };
  return { r: at(0), g: at(8), b: at(4) };
}

/**
 * `hsl()` and `hsla()`. A computed style is already `rgb()`; a token file is
 * read as text, and a token nobody can read is one every element is judged against.
 */
function parseHsl(text: string): Rgb | undefined {
  const call = HSL.exec(text);
  if (!call) return undefined;
  const { parts, alpha } = argumentsOf(call[1]!);
  if (parts.length < 3) return undefined;
  const degrees = hue(parts[0]!);
  const saturation = channel(parts[1]!, 1) / (parts[1]!.includes("%") ? 1 : 100);
  const lightness = channel(parts[2]!, 1) / (parts[2]!.includes("%") ? 1 : 100);
  const a = channel(alpha ?? "1", 1);
  if ([degrees, saturation, lightness, a].some((value) => Number.isNaN(value))) return undefined;
  return { ...fromHsl(degrees, saturation, lightness), a };
}

/** `color(srgb …)`, which is what `color-mix()` computes to. */
function parseSrgb(text: string): Rgb | undefined {
  const call = SRGB.exec(text);
  if (!call) return undefined;
  const { parts, alpha } = argumentsOf(call[1]!);
  if (parts.length < 3) return undefined;
  const [r, g, b] = parts.map((part) => channel(part, 1) * 255);
  const a = channel(alpha ?? "1", 1);
  if ([r, g, b, a].some((value) => Number.isNaN(value))) return undefined;
  return { r: r!, g: g!, b: b!, a: a };
}

const PARSERS = [parseHex, parseFunctional, parseHsl, parseSrgb];

/**
 * Parses what `getComputedStyle` returns and what a token file declares: hex,
 * `rgb()`, `hsl()` and `color(srgb …)`, in every spelling of each. A named
 * colour or a wider gamut — `oklch()`, `color(display-p3 …)` — returns
 * undefined, and a rule that cannot read a colour says nothing rather than guess.
 */
export function parseColor(value: string): Rgb | undefined {
  const text = value.trim();
  for (const parse of PARSERS) {
    const found = parse(text);
    if (found) return found;
  }
  return undefined;
}

/** Normalises a colour to `r,g,b,a`, so two spellings of one colour compare equal. */
export function colorKey(color: Rgb): string {
  const round = (value: number): number => Math.round(value);
  return `${round(color.r)},${round(color.g)},${round(color.b)},${color.a.toFixed(3)}`;
}

/** Composites a colour over an opaque backdrop, which is what the eye sees. */
export function over(color: Rgb, backdrop: Rgb): Rgb {
  const mix = (top: number, bottom: number): number => top * color.a + bottom * (1 - color.a);
  return {
    r: mix(color.r, backdrop.r),
    g: mix(color.g, backdrop.g),
    b: mix(color.b, backdrop.b),
    a: 1,
  };
}

/** WCAG relative luminance, on a colour already composited to opaque. */
export function relativeLuminance(color: Rgb): number {
  const [r, g, b] = [color.r, color.g, color.b].map((value) => {
    const channelValue = value / 255;
    return channelValue <= 0.040_45
      ? channelValue / 12.92
      : ((channelValue + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

/** WCAG contrast ratio, between 1 and 21. Order of the arguments does not matter. */
export function contrastRatio(foreground: Rgb, background: Rgb): number {
  const first = relativeLuminance(foreground);
  const second = relativeLuminance(background);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}
