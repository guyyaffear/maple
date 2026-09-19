/**
 * The screenshot taken at pick time, handed from the picker to the composer.
 *
 * It has to be taken before the composer opens: the panel insets the frame it
 * is over, so a capture taken afterwards is of a layout 360px narrower than
 * the one the reviewer was looking at — which is the exact fact the context
 * badge exists to record. The picker and the attachment strip are siblings,
 * so the image travels through a store on the root's context rather than
 * through a prop neither of them could pass.
 */

import { createContext, useContext } from "react";

import type { PastedImage } from "@maple-kit/core/screenshot";

/**
 * What the picker got. A failure travels the same way the image does: a
 * capture that quietly produced nothing is a strip saying "paste one" with no
 * hint that anything was tried, which reads as a feature that does not exist.
 */
export type Shot =
  | { readonly status: "taken"; readonly image: PastedImage }
  | { readonly status: "failed"; readonly reason: string };

/** A one-slot store. There is one composer, so there is one shot in flight. */
export interface ShotStore {
  /** The shot waiting to be claimed, or nothing. */
  get(): Shot | undefined;
  /** Called by the picker. Replaces anything unclaimed. */
  put(shot: Shot | undefined): void;
  /** Called by the strip: reads it and empties the slot in one go. */
  take(): Shot | undefined;
  subscribe(listener: () => void): () => void;
}

/** Builds the store. Holds a blob, touches no DOM, and is created per root. */
export function createShotStore(): ShotStore {
  const listeners = new Set<() => void>();
  let held: Shot | undefined;

  const tell = (): void => {
    for (const listener of listeners) listener();
  };

  return {
    get: () => held,
    put(shot) {
      held = shot;
      tell();
    },
    take() {
      const shot = held;
      held = undefined;
      if (shot) tell();
      return shot;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/** Internal: `Maple.Root` fills it, and a root without one still renders. */
export const ShotContext = /** @__PURE__ */ createContext<ShotStore | null>(null);

/** The store, or nothing when a part is mounted without a root that made one. */
export function useShots(): ShotStore | null {
  return useContext(ShotContext);
}
