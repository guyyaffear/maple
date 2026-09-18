/** Drag a rectangle: dashed, because the edge is the reviewer's, not the page's. */
import { createIcon } from "./icon.js";

export const RegionIcon = /** @__PURE__ */ createIcon({
  d: "M2 4.5h12v7H2z",
  dashArray: "3 2.4",
});
