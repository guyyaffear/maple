/**
 * Where Maple serves the preview, the panel moves the page instead of covering
 * it.
 *
 * The reviewer keeps seeing what they are describing, and the badge's content
 * width then tells the truth. One `setProperty` on an element the host gave.
 */

import { useEffect } from "react";

import { SHEET_BREAKPOINT_PX } from "../tokens.js";

/** What the hook measures against. `window` satisfies it. */
export interface InsetView {
  matchMedia(query: string): { readonly matches: boolean };
}

/** Set and removed, never assigned over. */
const PADDING = "padding-inline-end";

/** Insets by the panel's width while it is open and wide. A sheet has no room. */
export function useInset(
  frame: ElementCSSInlineStyle | null | undefined,
  panel: HTMLElement | null,
  view: InsetView | null | undefined,
): void {
  useEffect(() => {
    if (!frame || !panel || !view) return;
    if (!view.matchMedia(`(min-width: ${SHEET_BREAKPOINT_PX}px)`).matches) return;

    frame.style.setProperty(PADDING, `${panel.getBoundingClientRect().width}px`);
    return () => {
      frame.style.removeProperty(PADDING);
    };
  }, [frame, panel, view]);
}
