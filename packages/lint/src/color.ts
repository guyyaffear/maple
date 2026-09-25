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

/** Reads one `rgb()` argument, which may be a percentage. */
function channel(part: string, scale: number): number {
  const text = part.trim();
  const value = Number.parseFloat(text);
  if (Number.isNaN(value)) return Number.NaN;
  return text.endsWith("%") ? (value / 100) * scale : value;
}

/**
 * Parses what `getComputedStyle` returns and what a token file declares:
 * `#abc`, `#aabbcc`, `rgb(0 0 0)`, `rgb(0, 0, 0)` and the `rgba` spellings.
 * Anything else — a named colour, `color(display-p3 …)` — returns undefined,
 * and a rule that cannot read a colour says nothing rather than guessing.
 */
export function parseColor(value: string): Rgb | undefined {
  const text = value.trim();
  const short = HEX_SHORT.exec(text);
  if (short) {
    const [r, g, b] = short.slice(1, 4).map((part) => Number.parseInt(part + part, 16));
    return { r: r!, g: g!, b: b!, a: 1 };
  }
  const long = HEX_LONG.exec(text);
  if (long) {
    const [r, g, b] = long.slice(1, 4).map((part) => Number.parseInt(part, 16));
    return { r: r!, g: g!, b: b!, a: 1 };
  }
  return parseFunctional(text);
}

/** `rgb()` and `rgba()`, in both the comma and the space spelling. */
function parseFunctional(text: string): Rgb | undefined {
  const call = FUNCTIONAL.exec(text);
  if (!call) return undefined;
  const [rgb, alpha] = call[1]!.split("/");
  const parts = rgb!
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean);
  if (parts.length < 3) return undefined;
  const [r, g, b] = parts.map((part) => channel(part, 255));
  const a = alpha === undefined ? channel(parts[3] ?? "1", 1) : channel(alpha, 1);
  if ([r, g, b, a].some((value) => Number.isNaN(value!))) return undefined;
  return { r: r!, g: g!, b: b!, a: a };
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
