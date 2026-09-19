/**
 * Moving a mark off what it is covering, without moving what it is about.
 *
 * A mark stands just outside its anchor's corner, and sometimes that corner is
 * the one thing on the page worth reading. The offset is the reviewer's, not
 * the comment's: it is held for the session, never recorded, and never sent —
 * where a mark was dragged to says nothing about where the comment belongs.
 * The collision resolver stands down for a nudged mark, because a mark that
 * was put somewhere on purpose is not one to be stepped sideways.
 */

import { useCallback, useMemo, useRef, useState } from "react";

/** Under this, a pointer went down and up on a mark, which is a click. */
export const NUDGE_THRESHOLD_PX = 4;

/** As far as a mark goes. Past this it names something it is not beside. */
export const NUDGE_LIMIT_PX = 160;

/** How far a mark has been moved from where its anchor puts it. */
export interface Nudge {
  readonly dx: number;
  readonly dy: number;
}

/** Kept inside the limit on both axes, so a mark stays near its anchor. */
export function clampNudge(nudge: Nudge): Nudge {
  const hold = (value: number) => Math.max(-NUDGE_LIMIT_PX, Math.min(NUDGE_LIMIT_PX, value));
  return { dx: hold(nudge.dx), dy: hold(nudge.dy) };
}

/** True once the pointer has travelled far enough to be a drag, not a click. */
export function dragged(from: Nudge): boolean {
  return Math.abs(from.dx) >= NUDGE_THRESHOLD_PX || Math.abs(from.dy) >= NUDGE_THRESHOLD_PX;
}

/** The parts of a pointer event a nudge needs. Structural, so it tests flat. */
export interface NudgePointer {
  readonly clientX: number;
  readonly clientY: number;
  /** Absent on the click that ends a drag, which is a mouse event. */
  readonly pointerId?: number;
  readonly currentTarget: EventTarget | null;
  preventDefault?(): void;
  stopPropagation?(): void;
}

/** What one mark spreads to become draggable. */
export interface NudgeHandlers {
  readonly onPointerDown: (event: NudgePointer) => void;
  readonly onPointerMove: (event: NudgePointer) => void;
  readonly onPointerUp: (event: NudgePointer) => void;
  readonly onClickCapture: (event: NudgePointer) => void;
}

/** Every mark's offset, and the handlers that change one. */
export interface Nudges {
  readonly of: (id: string) => Nudge | undefined;
  readonly dragging: string | undefined;
  readonly handlersFor: (id: string) => NudgeHandlers;
}

interface Drag {
  readonly id: string;
  readonly from: { x: number; y: number };
  readonly base: Nudge;
  moved: boolean;
}

/** The session's offsets. Nothing here reaches storage or the controller. */
export function useNudges(): Nudges {
  const [offsets, setOffsets] = useState<ReadonlyMap<string, Nudge>>(new Map());
  const [dragging, setDragging] = useState<string>();
  const drag = useRef<Drag>(undefined);

  const move = useCallback((id: string, next: Nudge) => {
    setOffsets((was) => new Map(was).set(id, clampNudge(next)));
  }, []);

  const handlersFor = useCallback(
    (id: string): NudgeHandlers => ({
      onPointerDown: (event) => {
        const node = event.currentTarget;
        if (node instanceof Element && event.pointerId !== undefined) {
          node.setPointerCapture(event.pointerId);
        }
        drag.current = {
          id,
          from: { x: event.clientX, y: event.clientY },
          base: offsets.get(id) ?? { dx: 0, dy: 0 },
          moved: false,
        };
      },
      onPointerMove: (event) => {
        const held = drag.current;
        if (held?.id !== id) return;

        const travelled = { dx: event.clientX - held.from.x, dy: event.clientY - held.from.y };
        if (!held.moved && !dragged(travelled)) return;
        held.moved = true;
        setDragging(id);
        move(id, { dx: held.base.dx + travelled.dx, dy: held.base.dy + travelled.dy });
      },
      onPointerUp: () => {
        setDragging(undefined);
        if (drag.current?.id === id && !drag.current.moved) drag.current = undefined;
      },
      // The click that ends a drag is not a click on the comment, and a mark
      // that opened the panel every time it was moved would be unusable.
      onClickCapture: (event) => {
        if (drag.current?.id !== id || !drag.current.moved) return;
        drag.current = undefined;
        event.preventDefault?.();
        event.stopPropagation?.();
      },
    }),
    [move, offsets],
  );

  return useMemo(
    () => ({ of: (id) => offsets.get(id), dragging, handlersFor }),
    [dragging, handlersFor, offsets],
  );
}
