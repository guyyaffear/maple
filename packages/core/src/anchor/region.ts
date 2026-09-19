/**
 * A rectangle a reviewer drew, kept as fractions of the box it was drawn in.
 *
 * A region is not an element. It is an area that crosses several of them, and
 * recording the element under its middle threw away the whole point — the
 * comment came back as "the third metric card" when it was about the gap
 * between two of them. Fractions of a container survive a reflow that pixels
 * do not: the container is the smallest element that holds the whole rectangle,
 * so a page that lays out wider moves the region with the thing it was over.
 */

import type { AnchorRegion } from "../types.js";

/** A rectangle in viewport coordinates, which is what a client rect is. */
export interface RegionBox {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** A container with no width or height would divide by zero. */
const MINIMUM_SIDE = 1;

/** The drawn rectangle as fractions of the container it was drawn inside. */
export function regionOf(drawn: RegionBox, container: RegionBox): AnchorRegion {
  const width = Math.max(container.width, MINIMUM_SIDE);
  const height = Math.max(container.height, MINIMUM_SIDE);

  return {
    x: round((drawn.x - container.x) / width),
    y: round((drawn.y - container.y) / height),
    width: round(drawn.width / width),
    height: round(drawn.height / height),
  };
}

/** The rectangle again, against the container as the page has it now. */
export function regionBox(container: RegionBox, region: AnchorRegion): RegionBox {
  return {
    x: container.x + region.x * container.width,
    y: container.y + region.y * container.height,
    width: region.width * container.width,
    height: region.height * container.height,
  };
}

/** Four decimals: a fraction of a 1440px page, to a tenth of a pixel. */
function round(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}
