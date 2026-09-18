/**
 * The composer. A panel, and the same panel as a sheet on a narrow screen.
 *
 * The parts land in a later change. What is decided here is that the sheet is
 * not a variant: there is no `variant="sheet"` prop, there is one component and
 * a media query at `SHEET_BREAKPOINT_PX`, which the adopted stylesheet already
 * carries as `--mk-composer-w` and `--mk-composer-r`.
 */

export { SHEET_BREAKPOINT_PX } from "../tokens.js";

/** The one placeholder. It asks for a problem, not for a comment. */
export const COMPOSER_PLACEHOLDER = "What is wrong with this?";
