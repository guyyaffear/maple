/**
 * `Maple.Root`: one shadow root, one stylesheet, one controller.
 *
 * It mounts the overlay host in an effect, adopts the stylesheet, owns the
 * controller through `MapleProvider` and puts the shadow root in scope for
 * every part below it. Nothing here takes a comment list: parts read the
 * controller. Nothing here reaches `document` while React is rendering, which
 * is what lets an application server-render the tree it sits in.
 */

import { createOverlayHost } from "@maple-kit/core/overlay";
import { MapleProvider } from "@maple-kit/react";
import { createElement, forwardRef, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { MapleUiContext } from "./context.js";
import { OVERLAY_CSS, SCHEME_ATTRIBUTE } from "./stylesheet.js";
import { useOverlayScheme } from "./theme.js";

import type { MapleClient, MapleClientOptions, Scheme } from "@maple-kit/core/client";
import type { OverlayHost } from "@maple-kit/core/overlay";
import type { ReactElement, ReactNode } from "react";

/** `auto` is the opposite of the host's scheme, not the same as it. */
export type ThemePreference = "auto" | Scheme;

/** How the overlay is mounted, and what it is pointed at. */
export interface MapleRootProps {
  /** The branch the comments belong to. */
  readonly branch: string;
  readonly children?: ReactNode;
  /** Added to the overlay's own layer, inside the shadow root. */
  readonly className?: string;
  /** Defaults to `auto`: the opposite of whatever the host page is in. */
  readonly theme?: ThemePreference;
  /** Everything else the controller takes. `branch` comes from the prop above. */
  readonly options?: Omit<MapleClientOptions, "branch">;
  /** A controller the caller built and owns, started and destroyed by them. */
  readonly client?: MapleClient;
  /** For a host that mounts Maple with a script tag rather than a bundle. */
  readonly nonce?: string;
  /** Where the overlay's container is appended. Defaults to `document.body`. */
  readonly parent?: Element;
}

/** Mounts the overlay and puts its shadow root and controller in scope. */
export const MapleRoot = /** @__PURE__ */ forwardRef<HTMLDivElement, MapleRootProps>(
  function MapleRoot(props, ref) {
    const host = useOverlayHost(props.nonce, props.parent);
    const options = useMemo(
      () => ({ ...props.options, branch: props.branch }),
      [props.options, props.branch],
    );

    if (!host) return null;

    const className = props.className ? `mk-layer ${props.className}` : "mk-layer";
    const layer = createElement("div", { className, ref }, props.children);
    const scoped = createElement(OverlayLayer, { host, theme: props.theme ?? "auto" }, layer);

    return createElement(
      MapleProvider,
      props.client ? { client: props.client } : { options },
      createPortal(scoped, host.root),
    );
  },
);

/**
 * Mounted in an effect, so nothing reaches `document` during render — which
 * costs one extra commit and is what a portal target costs.
 */
function useOverlayHost(nonce: string | undefined, parent: Element | undefined) {
  const [host, setHost] = useState<OverlayHost>();

  useEffect(() => {
    const mounted = createOverlayHost({
      ...(nonce === undefined ? {} : { nonce }),
      ...(parent === undefined ? {} : { parent }),
    });
    mounted.addStyles(OVERLAY_CSS);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- a portal target cannot be built during render.
    setHost(mounted);
    return () => mounted.destroy();
  }, [nonce, parent]);

  return host;
}

interface OverlayLayerProps {
  readonly host: OverlayHost;
  readonly theme: ThemePreference;
  readonly children?: ReactNode;
}

/**
 * The scheme comes from the controller, never re-derived here, and lands
 * before paint, so a theme toggle shows no frame in the wrong one.
 */
function OverlayLayer(props: OverlayLayerProps): ReactElement {
  const theme = useOverlayScheme(props.theme);
  const { container, root } = props.host;

  useLayoutEffect(() => {
    container.setAttribute(SCHEME_ATTRIBUTE, theme.scheme);
  }, [container, theme.scheme]);

  const value = useMemo(
    () => ({ root, container, scheme: theme.scheme, hostScheme: theme.hostScheme }),
    [root, container, theme.scheme, theme.hostScheme],
  );

  return createElement(MapleUiContext.Provider, { value }, props.children);
}
