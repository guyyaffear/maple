/**
 * The marks on the page. The parts themselves land in a later change; the
 * geometry they are drawn from is here so it is decided once.
 *
 * Three signals never compete for the same pixel: fill says how far through its
 * life a comment is, the edge says how sure the anchor is, colour says its
 * status. `formFor` in the root entry decides fill; this decides the shape.
 */

export {
  COLLISION_GAP_PX,
  COLLISION_MAX_TRIES,
  COLLISION_STEP_PX,
  MARK_HIT_PX,
  MARK_OFFSET_PX,
  MARK_SIZE_PX,
  waterline,
} from "./geometry.js";
export type { Waterline } from "./geometry.js";
export { LEAF_OUTLINE, LEAF_ROTATION, LEAF_SOLID, LEAF_VIEW_BOX } from "./leaf.js";
