/**
 * The one component in this package: a controller, in scope, for its lifetime.
 *
 * It builds the controller on the first render and starts it in an effect, so
 * nothing reaches `document`, `localStorage` or the route while React is
 * rendering — which is also what lets a server render this without crashing. A
 * controller handed in through `client` is the caller's: this neither starts
 * nor destroys it, because two owners of one lifecycle disagree eventually.
 */

import { createMapleClient } from "@maple-kit/core/client";
import { createElement, useEffect, useMemo, useState } from "react";

import { MapleContext } from "./context.js";
import { createSnapshots } from "./snapshots.js";

import type { MapleClient, MapleClientOptions } from "@maple-kit/core/client";
import type { ReactElement, ReactNode } from "react";

/** Thrown when a provider was given neither a controller nor the options for one. */
export class MapleProviderError extends Error {
  override readonly name = "MapleProviderError";

  constructor() {
    super("<MapleProvider> needs either an options prop with a branch, or a client.");
  }
}

/** How the provider gets its controller, and what it does with it. */
export interface MapleProviderProps {
  readonly children?: ReactNode;
  /**
   * Read once, on the first render; pass a new `key` to rebuild. `askToLeave`
   * belongs here, and a surface above this provider may answer it later.
   */
  readonly options?: MapleClientOptions;
  /** A controller the caller built and owns. Started and destroyed by them. */
  readonly client?: MapleClient;
  /** Ask the route for the branch's comments on mount. Defaults to true. */
  readonly autoLoad?: boolean;
}

/** Puts a controller in scope for the hooks below it. */
export function MapleProvider(props: MapleProviderProps): ReactElement {
  const client = useClient(props);
  const snapshots = useMemo(() => createSnapshots(client), [client]);
  const value = useMemo(() => ({ client, snapshots }), [client, snapshots]);

  return createElement(MapleContext.Provider, { value }, props.children);
}

/**
 * The controller, built once. React may throw the first one away under Strict
 * Mode; an unstarted controller holds nothing, so that leaks nothing.
 */
function useClient(props: MapleProviderProps): MapleClient {
  const [built] = useState(() =>
    props.client ? undefined : createMapleClient(optionsFrom(props)),
  );

  useEffect(() => {
    if (!built) return;
    built.start();
    if (props.autoLoad !== false) void built.load();
    return () => built.destroy();
    // Only the controller: everything else here is read once, on mount, so
    // that a changed prop never tears down a started controller.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the omission above is the point.
  }, [built]);

  return props.client ?? asBuilt(built);
}

function optionsFrom(props: MapleProviderProps): MapleClientOptions {
  if (!props.options) throw new MapleProviderError();
  return props.options;
}

/** The initialiser above either built one or threw, but the type cannot say so. */
function asBuilt(client: MapleClient | undefined): MapleClient {
  if (!client) throw new MapleProviderError();
  return client;
}
