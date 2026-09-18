/**
 * The reviewer interface's state machine, with no interface attached.
 *
 * `@maple-kit/react` and any later Astro, Svelte or plain-JS binding are
 * subscriptions over what is exported here and nothing deeper. This entrypoint
 * is public surface, so everything on it is plain: Promises, structural types
 * and `Error` subclasses, never Effect.
 */

export { createDraftKeeper, DRAFT_DEBOUNCE_MS, DRAFT_LIFETIME_MS, draftIdFor } from "./drafts.js";
export type { DraftKeeper, DraftKeeperOptions } from "./drafts.js";
export { matchesFilter, openCount, visibleComments } from "./filters.js";
export { createNavigationGuard } from "./navigation.js";
export type {
  LeaveReason,
  NavigationGuard,
  NavigationGuardOptions,
  NavigationView,
} from "./navigation.js";
export { hostScheme, readThemeSignals, relativeLuminance, themeFrom, watchTheme } from "./theme.js";
export type { ThemeSignals, ThemeView, ThemeWatch, ThemeWatchOptions } from "./theme.js";
export { COMMENT_FILTERS } from "./types.js";
export type {
  ClientState,
  CommentFilter,
  ComposerState,
  ComposerTarget,
  PickKind,
  PickState,
  PostedComment,
  ResolutionClaim,
  Scheme,
  ThemeSource,
  ThemeState,
} from "./types.js";
