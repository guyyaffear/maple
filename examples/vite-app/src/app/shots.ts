/**
 * Stand-in thumbnails for the screenshots the seeded comments carry.
 *
 * A `MediaRef` is a connector and a key, never a URL: the panel asks the
 * application to turn one into something an `img` can load, and this demo has
 * no blob store to ask. Two inline SVGs stand in for what `captureElement`
 * would have produced, so the strip shows an image rather than a sentence
 * about one.
 */

import type { MediaRef } from "@maple-kit/core";

/** One frame, in the demo's own ink, at the strip's 72×46 aspect. */
function frame(body: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 144 92">` +
    `<rect width="144" height="92" fill="#f6f7f9"/>${body}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/** Keyed by what the seed recorded, which is the whole of the contract here. */
const SHOTS: Readonly<Record<string, string>> = {
  "metric-row": frame(
    `<g fill="#fff" stroke="#e3e6ea"><rect x="8" y="22" width="28" height="48" rx="3"/>` +
      `<rect x="42" y="22" width="28" height="48" rx="3"/>` +
      `<rect x="76" y="22" width="28" height="40" rx="3"/>` +
      `<rect x="110" y="22" width="26" height="52" rx="3"/></g>`,
  ),
  "split-gap": frame(
    `<rect x="8" y="12" width="72" height="68" rx="3" fill="#fff" stroke="#e3e6ea"/>` +
      `<rect x="96" y="12" width="40" height="34" rx="3" fill="#fff" stroke="#e3e6ea"/>` +
      `<rect x="96" y="52" width="40" height="28" rx="3" fill="none" stroke="#c9ced6" ` +
      `stroke-dasharray="3 3"/>`,
  ),
};

/** What the panel calls to draw a kept attachment. Undefined draws the line. */
export function resolveShot(ref: MediaRef): string | undefined {
  return SHOTS[ref.key];
}
