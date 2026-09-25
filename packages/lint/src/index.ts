/**
 * Design-system lint for Maple. This entrypoint is the rendered tier: the
 * rules that need a browser to have laid the page out before they can judge it.
 *
 * The static and judged tiers of the tracking issue land beside it and report
 * the same `Finding`.
 */

export { colorKey, contrastRatio, over, parseColor, relativeLuminance } from "./color.js";
export type { Rgb } from "./color.js";
export { DEFAULT_VIEWPORTS, dedupe, lintRendered } from "./rendered/audit.js";
export type { Pass, RenderedLintOptions, Viewport } from "./rendered/audit.js";
export { collectStyleRecords } from "./rendered/collect.js";
export type { StyleRecord } from "./rendered/collect.js";
export {
  MIN_TOUCH_TARGET,
  MOTION_SAFE,
  RENDERED_RULES,
  renderedFindings,
} from "./rendered/rules.js";
export type { RuleDefinition } from "./rendered/rules.js";
export { lengthToPx, mergeTokens, parseTokens, readTokenFiles, ROOT_FONT_SIZE } from "./tokens.js";
export type { TokenSet } from "./tokens.js";
export type { Finding, FindingAnchor, Severity, Tier } from "./types.js";
