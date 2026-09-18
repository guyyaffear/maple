/**
 * The overlay's scheme, read off the controller and never re-derived.
 *
 * `@maple-kit/core/client` already watches the host page's attributes, classes,
 * computed `color-scheme` and background luminance and re-runs on a change.
 * A second detector here would disagree with the first one eventually, and the
 * scheme a comment records would be whichever of the two answered last.
 */

import { useMaple } from "@maple-kit/react";
import { useMemo } from "react";

import type { ThemePreference } from "./root.js";
import type { Scheme } from "@maple-kit/core/client";

/** The overlay's scheme and the host's, which are not the same scheme. */
export interface OverlayTheme {
  /** What the overlay is drawn in. */
  readonly scheme: Scheme;
  /** What the host page is in, which is what a comment records. */
  readonly hostScheme: Scheme;
}

/** `auto` takes the opposite of the host; anything else is taken literally. */
export function useOverlayScheme(preference: ThemePreference): OverlayTheme {
  const { theme } = useMaple();

  return useMemo(
    () => ({
      scheme: preference === "auto" ? theme.overlay : preference,
      hostScheme: theme.host,
    }),
    [preference, theme.overlay, theme.host],
  );
}
