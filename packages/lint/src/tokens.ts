/**
 * The token set a rendered rule checks against, read from the same CSS files
 * the static tier is configured with.
 *
 * A token file is read as text and scanned for custom-property declarations
 * rather than parsed as a stylesheet: the rules only need the values, and a
 * scan has no opinion about the selectors they were declared under.
 */

import { readFile } from "node:fs/promises";

import { colorKey, isUnreadableColor, parseColor } from "./color.js";

/** Every value a rule is allowed to see, keyed the way the rule compares it. */
export interface TokenSet {
  /** Declared colours, as `colorKey` strings. */
  readonly colors: ReadonlySet<string>;
  /** Declared lengths that read as a font size, in px. */
  readonly fontSizes: ReadonlySet<number>;
  /** Custom-property names, for a message that can name the token. */
  readonly names: ReadonlyMap<string, string>;
  /**
   * Declarations meant to be a colour that could not be read, by name. Every
   * element painted from one would be judged against a set lacking it.
   */
  readonly unreadable: ReadonlyMap<string, string>;
}

/** How a rem in a token file converts to the px a computed style reports. */
export const ROOT_FONT_SIZE = 16;

/** A custom-property declaration, wherever it sits: a token file may be minified. */
const DECLARATION = /(--\w[\w-]*)\s*:([^;}]+)/g;
const REFERENCE = /^var\(\s*(--[\w-]+)\s*(?:,([^)]*))?\)$/;

/** How far a chain of `var()` is followed before it is called a cycle. */
const MAX_INDIRECTION = 8;
const LENGTH = /^(-?[\d.]+)(px|rem|em)$/;

/** Converts a CSS length to px, or undefined when it is not one. */
export function lengthToPx(value: string, rootFontSize = ROOT_FONT_SIZE): number | undefined {
  const match = LENGTH.exec(value.trim());
  if (!match) return undefined;
  const size = Number.parseFloat(match[1]!);
  return match[2] === "px" ? size : size * rootFontSize;
}

/**
 * Follows `var(--other)` to the value it stands for, taking the fallback when
 * the name is not declared. A chain that loops stops at the depth cap.
 */
function resolve(value: string, names: ReadonlyMap<string, string>, depth = 0): string {
  const reference = REFERENCE.exec(value.trim());
  if (!reference || depth >= MAX_INDIRECTION) return value;
  const next = names.get(reference[1]!) ?? reference[2]?.trim();
  return next === undefined ? value : resolve(next, names, depth + 1);
}

/**
 * Scans CSS text for custom properties. A theme layer that declares
 * `--surface: var(--grey-100)` contributes the colour it resolves to, because
 * an element painted from it computes to that colour and nothing else.
 */
export function parseTokens(css: string, rootFontSize = ROOT_FONT_SIZE): TokenSet {
  const colors = new Set<string>();
  const fontSizes = new Set<number>();
  const names = new Map<string, string>();
  const unreadable = new Map<string, string>();
  for (const [, name, raw] of css.matchAll(DECLARATION)) names.set(name!, raw!.trim());
  for (const [name, declared] of names) {
    const value = resolve(declared, names);
    const color = parseColor(value);
    if (color) colors.add(colorKey(color));
    else if (isUnreadableColor(value)) unreadable.set(name, value);
    const length = lengthToPx(value, rootFontSize);
    if (length !== undefined && isTypeToken(name)) fontSizes.add(length);
  }
  return { colors, fontSizes, names, unreadable };
}

/**
 * Which length tokens are a font size. A spacing or radius token is a length
 * too, and a type scale that admitted them would admit almost any size.
 */
function isTypeToken(name: string): boolean {
  return /(^|-)(text|font|type)(-|$)/.test(name);
}

/**
 * Reads every configured token file as one sheet, so a theme file that refers
 * to a base file's token resolves the way the browser resolves it.
 */
export async function readTokenFiles(
  paths: readonly string[],
  rootFontSize = ROOT_FONT_SIZE,
): Promise<TokenSet> {
  const sources = await Promise.all(paths.map((path) => readFile(path, "utf8")));
  return parseTokens(sources.join("\n"), rootFontSize);
}

/** Merges token sets, later files adding to earlier ones. */
export function mergeTokens(sets: readonly TokenSet[]): TokenSet {
  const colors = new Set<string>();
  const fontSizes = new Set<number>();
  const names = new Map<string, string>();
  const unreadable = new Map<string, string>();
  for (const set of sets) {
    for (const color of set.colors) colors.add(color);
    for (const size of set.fontSizes) fontSizes.add(size);
    for (const [name, value] of set.names) names.set(name, value);
    for (const [name, value] of set.unreadable) unreadable.set(name, value);
  }
  return { colors, fontSizes, names, unreadable };
}
