/**
 * Stand-in screenshots for the comments the demo starts with.
 *
 * A `MediaRef` is a connector and a key, never a URL, and the demo's route
 * keeps blobs in memory like any other — so these are put into it at startup
 * and come back through `GET /api/maple/media/…` exactly as a real capture
 * would. Two inline SVGs stand in for what `captureElement` would produce.
 */

/** One frame, in the demo's own ink, at the strip's 72x46 aspect. */
function frame(body: string): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 144 92">` +
    `<rect width="144" height="92" fill="#f6f7f9"/>${body}</svg>`
  );
}

/** The two the seed attaches, in the order the seed expects them. */
export const SEEDED_FRAMES: readonly string[] = [
  frame(
    `<rect x="8" y="12" width="72" height="68" rx="3" fill="#fff" stroke="#e3e6ea"/>` +
      `<rect x="96" y="12" width="40" height="34" rx="3" fill="#fff" stroke="#e3e6ea"/>` +
      `<rect x="96" y="52" width="40" height="28" rx="3" fill="none" stroke="#c9ced6" ` +
      `stroke-dasharray="3 3"/>`,
  ),
  frame(
    `<g fill="#fff" stroke="#e3e6ea"><rect x="8" y="22" width="28" height="48" rx="3"/>` +
      `<rect x="42" y="22" width="28" height="48" rx="3"/>` +
      `<rect x="76" y="22" width="28" height="40" rx="3"/>` +
      `<rect x="110" y="22" width="26" height="52" rx="3"/></g>`,
  ),
];
