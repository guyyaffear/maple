/**
 * The marks on the page: the leaf, the four forms a comment's life has, and
 * the words each one says.
 *
 * Three signals never compete for the same pixel: fill says how far through
 * its life a comment is, the edge says how sure the anchor is, colour says its
 * status. `formFor` in the root entry decides fill; this decides the shape.
 */

export { MapleAvatar, MapleAvatar as Avatar, initialsOf } from "./avatar.js";
export type { AvatarProps } from "./avatar.js";
export { marksCss } from "./css.js";
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
export { kindPhrase, markLabel, markTitle, NOTHING_NAMED, ringLabel } from "./label.js";
export type { RingLabel } from "./label.js";
export { LEAF_OUTLINE, LEAF_ROTATION, LEAF_SOLID, LEAF_VIEW_BOX } from "./leaf.js";
export { MapleMark, MapleMark as Mark } from "./mark.js";
export type { MarkProps } from "./mark.js";
export { HALF, inside, MapleLeaf, MapleLeaf as Leaf, nextClipId } from "./shape.js";
export type { LeafProps } from "./shape.js";
