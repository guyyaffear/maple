/**
 * `Maple.Island`: the one object a page at rest carries.
 *
 * It is a pill until it is asked for, and the card that replaces it carries
 * both halves of the job — what has been said here, and how to say something.
 * That is why entering comment mode has no chrome of its own: a second
 * permanent thing over the preview is wrong before anything else about it.
 */

import { useMaple } from "@maple-kit/react";
import { createElement, forwardRef, useCallback, useId, useMemo, useState } from "react";

import { useMapleUi } from "../context.js";
import { numbersFor, orphanReason } from "./comments.js";
import { IslandContext } from "./context.js";
import { cx, renderPart } from "./part.js";

import type { IslandContextValue, IslandPhase } from "./context.js";
import type { PartProps } from "./part.js";
import type { Comment } from "@maple-kit/core";
import type { OrphanReason } from "@maple-kit/core/anchor";
import type { ReactNode } from "react";

const PART = "<Maple.Island>";

/** How the island starts, and what goes inside it. */
export interface IslandProps extends PartProps {
  readonly children?: ReactNode;
  /** Collapsed unless something already asked for it open. */
  readonly defaultOpen?: boolean;
}

/** The island's own corner, and the state its parts share. */
export const Island = /** @__PURE__ */ forwardRef<HTMLDivElement, IslandProps>(
  function Island(props, ref) {
    const { asChild, children, className, defaultOpen, ...rest } = props;
    const value = useIslandState(defaultOpen === true);

    const element = renderPart(
      "div",
      asChild,
      {
        ...rest,
        className: cx("mk-island", className),
        "data-mk-open": String(isOpen(value)),
        ref,
      },
      children,
    );

    return createElement(IslandContext.Provider, { value }, element);
  },
);

function isOpen(value: IslandContextValue): boolean {
  return value.phase !== "closed";
}

/**
 * Opening is immediate and closing runs the exit first, because a close that
 * waits for anything reads as a surface that did not hear the click.
 */
function useIslandState(defaultOpen: boolean): IslandContextValue {
  const { comments } = useMaple();
  const [phase, setPhase] = useState<IslandPhase>(defaultOpen ? "open" : "closed");
  const [developer, setDeveloper] = useState(false);
  const contentId = useId();

  const setOpen = useCallback((open: boolean) => {
    setPhase((current) => (open ? "open" : leaving(current)));
  }, []);
  const settled = useCallback(() => {
    setPhase((current) => (current === "closing" ? "closed" : current));
  }, []);
  const numbers = useMemo(() => numbersFor(comments), [comments]);
  const orphans = useOrphans(comments);

  return useMemo(
    () => ({
      phase,
      setOpen,
      settled,
      developer,
      setDeveloper,
      contentId,
      numbers,
      comments,
      orphans,
    }),
    [phase, setOpen, settled, developer, contentId, numbers, comments, orphans],
  );
}

/** A close runs its exit first; anything already closed stays closed. */
function leaving(phase: IslandPhase): IslandPhase {
  return phase === "open" ? "closing" : phase;
}

/**
 * Why each unpinned comment has no place, resolved once for the island rather
 * than once per row: the wire records the anchor, never what came of it.
 */
function useOrphans(comments: readonly Comment[]): ReadonlyMap<string, OrphanReason> {
  const { container } = useMapleUi(PART);
  const page = container.ownerDocument;

  return useMemo(() => {
    const found = new Map<string, OrphanReason>();
    for (const comment of comments) {
      if (comment.status !== "orphaned") continue;
      const reason = orphanReason(comment.anchor, page);
      if (reason !== undefined) found.set(comment.id, reason);
    }
    return found;
  }, [comments, page]);
}
