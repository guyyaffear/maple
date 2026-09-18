/**
 * Swapping one icon for another with both of them in the DOM.
 *
 * The outgoing icon fades out while the incoming one scales and un-blurs into
 * place; removing the outgoing first would read as a flicker rather than a
 * swap. The motion itself is `.mk-icon-swap` in the adopted stylesheet, so this
 * adds nothing to the bundle and honours reduced motion with everything else.
 */

import { createElement, useState } from "react";

import type { ReactElement, ReactNode } from "react";

/** One icon, and the name that says when it changed. */
interface Shown {
  readonly name: string;
  readonly node: ReactNode;
}

/** What a part hands the cross-fade: the icon, and what to call it. */
export interface IconCrossfadeProps {
  /** Changing this starts a swap. Two icons with one name never cross-fade. */
  readonly name: string;
  readonly children: ReactNode;
  readonly className?: string;
}

interface Swap {
  readonly current: Shown;
  readonly previous?: Shown;
}

/**
 * Derived state, set during render rather than in an effect: an effect would
 * paint the new icon once at full opacity before the transition began.
 */
export function IconCrossfade(props: IconCrossfadeProps): ReactElement {
  const next: Shown = { name: props.name, node: props.children };
  const [swap, setSwap] = useState<Swap>({ current: next });

  if (swap.current.name !== props.name) {
    setSwap({ current: next, previous: swap.current });
  }

  const className = props.className ? `mk-icon-swap ${props.className}` : "mk-icon-swap";
  const shown = swap.current.name === props.name ? swap.current : next;

  return createElement(
    "span",
    { className, onTransitionEnd: () => setSwap({ current: shown }) },
    swap.previous ? frame(swap.previous, "out") : null,
    frame(shown, "in"),
  );
}

function frame(shown: Shown, direction: "in" | "out"): ReactElement {
  return createElement("span", { key: shown.name, "data-mk-icon": direction }, shown.node);
}
