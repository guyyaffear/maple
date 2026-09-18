/**
 * React bindings for Maple's reviewer controller, and nothing else.
 *
 * `@maple-kit/core/client` holds the state machine; this is a subscription
 * over it. No styles, no components beyond the provider, and no dependency on
 * `@maple-kit/ui` — an application rendering comments in its own design system
 * depends on this package and pulls in none of the composed parts.
 *
 * Everything here is public surface, so it is plain: Promises, structural
 * types and `Error` subclasses. React is a peer, 18 or 19.
 */

export { MapleContextError } from "./context.js";
export type { MapleContextValue } from "./context.js";
export {
  useAnchor,
  useComments,
  useComposer,
  useDraft,
  useMaple,
  useMapleClient,
  usePicker,
} from "./hooks.js";
export { MapleProvider, MapleProviderError } from "./provider.js";
export type { MapleProviderProps } from "./provider.js";
export { createSnapshots } from "./snapshots.js";
export type { Snapshots } from "./snapshots.js";
