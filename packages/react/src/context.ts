/**
 * What a provider puts in scope, and the one error a misuse produces.
 *
 * The controller and its reads travel together: a hook needs the reads, and an
 * application needs the controller to call anything imperative on it. Both are
 * built once per provider, so this value is stable and a consumer of it never
 * re-renders because the context changed.
 */

import { createContext, useContext } from "react";

import type { Snapshots } from "./snapshots.js";
import type { MapleClient } from "@maple-kit/core/client";

/** The controller in scope, and the stable reads of it the hooks use. */
export interface MapleContextValue {
  readonly client: MapleClient;
  readonly snapshots: Snapshots;
}

/** Internal: `MapleProvider` is the only supported way to fill this. */
export const MapleContext = /** @__PURE__ */ createContext<MapleContextValue | null>(null);

/** Thrown by every hook when there is no `<MapleProvider>` above it. */
export class MapleContextError extends Error {
  override readonly name = "MapleContextError";

  constructor(hook: string) {
    super(`${hook} was called outside a <MapleProvider>. Wrap the tree that uses it.`);
  }
}

/** The context, or a readable error rather than a null dereference. */
export function useMapleContext(hook: string): MapleContextValue {
  const value = useContext(MapleContext);
  if (value === null) throw new MapleContextError(hook);
  return value;
}
