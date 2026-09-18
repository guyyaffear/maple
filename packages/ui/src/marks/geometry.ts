/**
 * Where a mark goes and how big its half-fill is.
 *
 * The collision resolver steps a colliding mark sideways at most three times:
 * a fourth is further from its anchor than it is worth. Hit areas are 40px and
 * the step is wider than the visible mark, so two marks' hit areas never
 * overlap — which is half of what the resolver exists for.
 */

/** The visible mark. The hit area is larger and extended with a pseudo-element. */
export const MARK_SIZE_PX = 34;

/** The smallest a control may be to be hit reliably with a thumb. */
export const MARK_HIT_PX = 40;

/** A mark sits just outside its anchor's top-left corner. */
export const MARK_OFFSET_PX = 16;

/** Two candidates collide when both axes are inside this. */
export const COLLISION_GAP_PX = 31;

/** How far a colliding mark steps sideways before trying again. */
export const COLLISION_STEP_PX = 32;

/** Three tries. A fourth lands further from the anchor than it is worth. */
export const COLLISION_MAX_TRIES = 3;

/** The clip rectangle that gives the half-filled form its horizontal waterline. */
export interface Waterline {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** The view box is 78 units square and fills from its bottom edge upward. */
const BOX = 78;
const BOTTOM = 71;
const ORIGIN = -7;

/**
 * The clip sits outside the rotation, so the waterline stays horizontal on
 * screen while the leaf stays tilted. A fraction outside 0..1 is clamped.
 */
export function waterline(fraction: number): Waterline {
  const clamped = Math.min(Math.max(fraction, 0), 1);
  const height = BOX * clamped;
  return { x: ORIGIN, y: BOTTOM - height, width: BOX, height };
}
