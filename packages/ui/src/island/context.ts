/**
 * What the island's parts share: whether it is open, and the two settings.
 *
 * The card is closed by unmounting it, so the state that must outlive a close
 * lives here rather than inside it — a setting toggled, the island shut and
 * opened again is the same setting. Hiding resolved is the controller's, since
 * it changes the list every other surface reads too.
 */

import { createContext, useContext } from "react";

import type { Comment } from "@maple-kit/core";
import type { OrphanReason } from "@maple-kit/core/anchor";

/** Open, shut, or on its way out: a close animates before it unmounts. */
export type IslandPhase = "closed" | "closing" | "open";

/** What every part below `Maple.Island` reads. */
export interface IslandContextValue {
  readonly phase: IslandPhase;
  /** Opening is immediate; closing runs the exit and then unmounts. */
  readonly setOpen: (open: boolean) => void;
  /** Called by the card once its exit animation has finished. */
  readonly settled: () => void;
  /** Off by default. What it reveals is the developer detail, not the switch. */
  readonly developer: boolean;
  readonly setDeveloper: (on: boolean) => void;
  /** Ties the pill to the card for assistive technology. */
  readonly contentId: string;
  /** Each comment's place on the branch, oldest first. */
  readonly numbers: ReadonlyMap<string, number>;
  /** Everything on the branch, whatever the filter says. */
  readonly comments: readonly Comment[];
  /** Why each unpinned comment has no place, asked of the page as it is now. */
  readonly orphans: ReadonlyMap<string, OrphanReason>;
}

/** Internal: `Maple.Island` is the only supported way to fill this. */
export const IslandContext = /** @__PURE__ */ createContext<IslandContextValue | null>(null);

/** The rows the filters control, which is one element and needs one id. */
export function listId(contentId: string): string {
  return `${contentId}-list`;
}

/** Thrown by an island part rendered outside `<Maple.Island>`. */
export class IslandContextError extends Error {
  override readonly name = "IslandContextError";

  constructor(part: string) {
    super(`${part} was rendered outside <Maple.Island>. Every island part needs one above it.`);
  }
}

/** The island's state, or a readable error rather than a null. */
export function useIsland(part: string): IslandContextValue {
  const value = useContext(IslandContext);
  if (value === null) throw new IslandContextError(part);
  return value;
}
