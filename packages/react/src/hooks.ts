/**
 * Seven subscriptions and an escape hatch. There is no eighth thing here.
 *
 * Every hook is one `useSyncExternalStore` over a read from `snapshots.ts`,
 * because anything else — a filter applied in a hook body, a sort, a lookup
 * table — is logic an Astro or Svelte binding would have to write again. When
 * a hook wants to do more than read, the answer is a method on the controller.
 * `getServerSnapshot` is that same read: the controller touches nothing until
 * `start()`, and `start()` only ever runs in an effect.
 */

import { useCallback, useSyncExternalStore } from "react";

import { useMapleContext } from "./context.js";

import type { Comment } from "@maple-kit/core";
import type { Anchor } from "@maple-kit/core/anchor";
import type {
  ClientState,
  CommentFilter,
  ComposerState,
  GitHubLink,
  MapleClient,
  PickState,
} from "@maple-kit/core/client";
import type { Draft } from "@maple-kit/core/overlay";

/**
 * The whole state. Re-renders on every change, which is what a top-level
 * consumer wants and what a mark or a filter button does not — those take a
 * narrower hook below.
 */
export function useMaple(): ClientState {
  const { snapshots } = useMapleContext("useMaple()");
  return useSyncExternalStore(snapshots.subscribe, snapshots.state, snapshots.state);
}

/**
 * The controller itself, for everything imperative: `setFilter`, `arm`,
 * `openComposer`, `send`. Stable for the provider's lifetime, so a component
 * that only calls methods never re-renders.
 */
export function useMapleClient(): MapleClient {
  return useMapleContext("useMapleClient()").client;
}

/**
 * The comments a filter shows, in render order. With no argument it follows
 * the filter the inventory is on. The array is the same array until the
 * comments, the filter or the resolved setting change.
 */
export function useComments(filter?: CommentFilter): readonly Comment[] {
  const { snapshots } = useMapleContext("useComments()");
  const read = useCallback(() => snapshots.comments(filter), [snapshots, filter]);
  return useSyncExternalStore(snapshots.subscribe, read, read);
}

/** The composer, open or closed, with its body, attachments and dirtiness. */
export function useComposer(): ComposerState {
  const { snapshots } = useMapleContext("useComposer()");
  return useSyncExternalStore(snapshots.subscribe, snapshots.composer, snapshots.composer);
}

/**
 * The reviewer's GitHub link. `unsupported` means the route serves no sign-in
 * at all, and a surface draws nothing rather than an offer nobody can take.
 * `linkGitHub` and `unlinkGitHub` on the controller are what act on it.
 */
export function useGitHubLink(): GitHubLink {
  const { snapshots } = useMapleContext("useGitHubLink()");
  return useSyncExternalStore(snapshots.subscribe, snapshots.github, snapshots.github);
}

/** Whether a pick is armed and which kind, for the three pick buttons. */
export function usePicker(): PickState {
  const { snapshots } = useMapleContext("usePicker()");
  return useSyncExternalStore(snapshots.subscribe, snapshots.picker, snapshots.picker);
}

/** The anchor behind a comment id, a draft id, or the open composer's draft. */
export function useAnchor(id: string): Anchor | undefined {
  const { snapshots } = useMapleContext("useAnchor()");
  const read = useCallback(() => snapshots.anchor(id), [snapshots, id]);
  return useSyncExternalStore(snapshots.subscribe, read, read);
}

/** The draft the composer is writing into, or the one with the given id. */
export function useDraft(id?: string): Draft | undefined {
  const { snapshots } = useMapleContext("useDraft()");
  const read = useCallback(() => snapshots.draft(id), [snapshots, id]);
  return useSyncExternalStore(snapshots.subscribe, read, read);
}
