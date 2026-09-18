/**
 * Referentially stable reads of the controller, for `useSyncExternalStore`.
 *
 * The controller replaces its state object whole, so React's bail-out is
 * `Object.is` on whatever a hook hands back. A derived view — the comment list
 * under a filter — is therefore cached against the inputs it came from, or a
 * narrow hook re-renders on every keystroke in the composer and a hook building
 * a fresh array on each read never settles. Nothing here decides anything: the
 * derivation is the controller's own selector, called once per distinct input.
 */

import { visibleComments } from "@maple-kit/core/client";

import type { Comment } from "@maple-kit/core";
import type { Anchor } from "@maple-kit/core/anchor";
import type {
  ClientState,
  CommentFilter,
  ComposerState,
  MapleClient,
  PickState,
} from "@maple-kit/core/client";
import type { Draft } from "@maple-kit/core/overlay";

/** One read per hook, each stable while the thing it reads has not changed. */
export interface Snapshots {
  /** Stable for the life of the controller, so a re-render never resubscribes. */
  readonly subscribe: (onStoreChange: () => void) => () => void;
  /** Everything. Changes on every change, which is what `useMaple` wants. */
  readonly state: () => ClientState;
  /** The comments a filter shows; the controller's current filter when none is given. */
  readonly comments: (filter?: CommentFilter) => readonly Comment[];
  readonly composer: () => ComposerState;
  readonly picker: () => PickState;
  /** The anchor behind a comment id, a draft id, or the open composer's draft. */
  readonly anchor: (id: string) => Anchor | undefined;
  /** A draft by id, or the one the composer is writing into. */
  readonly draft: (id?: string) => Draft | undefined;
}

/** What a cached list was derived from. All three have to match to reuse it. */
interface Derived {
  readonly comments: readonly Comment[];
  readonly filter: CommentFilter;
  readonly showResolved: boolean;
  readonly value: readonly Comment[];
}

/** Opens the reads for one controller. One per provider, never per render. */
export function createSnapshots(client: MapleClient): Snapshots {
  const derived = new Map<string, Derived>();

  return {
    subscribe: (onStoreChange) => client.subscribe(onStoreChange),
    state: () => client.getState(),
    comments: (filter) => listFor(client.getState(), filter, derived),
    composer: () => client.getState().composer,
    picker: () => client.getState().pick,
    anchor: (id) => anchorFor(client.getState(), id),
    draft: (id) => draftFor(client.getState(), id),
  };
}

/**
 * The list under one filter, recomputed only when the comments, the filter or
 * the resolved setting changed. Anything else hands back the same array.
 */
function listFor(
  state: ClientState,
  filter: CommentFilter | undefined,
  derived: Map<string, Derived>,
): readonly Comment[] {
  const key = filter ?? "";
  const wanted = filter ?? state.filter;
  const cached = derived.get(key);
  if (
    cached?.comments === state.comments &&
    cached.filter === wanted &&
    cached.showResolved === state.showResolved
  ) {
    return cached.value;
  }

  const value = visibleComments(state.comments, wanted, state.showResolved);
  derived.set(key, {
    comments: state.comments,
    filter: wanted,
    showResolved: state.showResolved,
    value,
  });
  return value;
}

/**
 * Comments first, then drafts, then the composer's own target — so a mark and
 * the ring ask the same question of a sent comment and an unsent one.
 */
function anchorFor(state: ClientState, id: string): Anchor | undefined {
  const comment = state.comments.find((one) => one.id === id);
  if (comment) return comment.anchor;

  const draft = state.drafts.find((one) => one.id === id);
  if (draft) return draft.anchor;

  return state.composer.draftId === id ? state.composer.target?.anchor : undefined;
}

function draftFor(state: ClientState, id: string | undefined): Draft | undefined {
  const wanted = id ?? state.composer.draftId;
  return wanted === undefined ? undefined : state.drafts.find((one) => one.id === wanted);
}
