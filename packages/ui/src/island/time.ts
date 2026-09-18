/**
 * How long ago a comment was written, in the shortest true form.
 *
 * `Intl.RelativeTimeFormat` is in every browser the overlay supports and costs
 * the bundle nothing, so this is a unit choice and a rounding rule rather than
 * a date library.
 */

/** Seconds in each unit, largest first. */
const UNITS: readonly (readonly [Intl.RelativeTimeFormatUnit, number])[] = [
  ["year", 31536000],
  ["month", 2592000],
  ["week", 604800],
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
];

const FORMAT = /** @__PURE__ */ new Intl.RelativeTimeFormat(undefined, { style: "narrow" });

/** "3h ago", or "now" for anything inside the last minute. */
export function relativeTime(iso: string, now: number): string {
  const seconds = (Date.parse(iso) - now) / 1000;
  if (!Number.isFinite(seconds)) return "";

  for (const [unit, size] of UNITS) {
    const value = seconds / size;
    if (Math.abs(value) >= 1) return FORMAT.format(Math.round(value), unit);
  }
  return "now";
}
