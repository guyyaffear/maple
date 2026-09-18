/**
 * The Maple route, faked — the same fake the controller's own suite drives.
 *
 * A second fake of one route is a second opinion about what that route
 * returns, and two opinions drift. This re-exports core's rather than
 * restating it, so a binding test and a controller test can never disagree
 * about what a page or an error looks like.
 */

export {
  createMapleFake,
  MAPLE_BASE,
  MAPLE_ORIGIN,
  mapleUnavailable,
} from "../../../core/test/msw/maple.js";
export type { MapleFake, MapleFakeOptions } from "../../../core/test/msw/maple.js";
