/**
 * Dragging the island out of the way of the thing being reviewed.
 *
 * It follows the pointer through pointer capture rather than a listener on
 * the page, so nothing outside the shadow root is touched and a pointer
 * leaving the window still ends the gesture. The offset is two custom
 * properties set with `setProperty`, never a rule, and the corner is
 * `nearestCorner` in the controller. No state changes while it moves:
 * re-rendering the island to drag it re-runs the card entrance every frame.
 */

import { nearestCorner } from "@maple-kit/core/client";
import { useMemo, useRef } from "react";

import type { DragHandlers, PointerEventLike } from "./context.js";
import type { Corner } from "@maple-kit/core/client";

/** How far a pointer travels before it is a drag and not a slow click. */
export const DRAG_THRESHOLD_PX = 4;

/** Set on the island while it is under the pointer. */
export const DRAGGING_ATTRIBUTE = "data-mk-dragging";

interface Gesture {
  node: HTMLElement | null;
  x: number;
  y: number;
  pressed: boolean;
  dragging: boolean;
  moved: boolean;
}

/** Moves the island with the pointer, and hands the corner to the controller. */
export function useDrag(container: HTMLElement, onSnap: (corner: Corner) => void): DragHandlers {
  const gesture = useRef<Gesture>({
    node: null,
    x: 0,
    y: 0,
    pressed: false,
    dragging: false,
    moved: false,
  });

  return useMemo(
    () => ({
      attach: (node: HTMLElement | null) => {
        gesture.current.node = node;
      },
      moved: () => gesture.current.moved,
      onPointerDown: (event) => start(gesture.current, event),
      onPointerMove: (event) => move(gesture.current, event),
      onPointerUp: (event) => end(gesture.current, event, container, onSnap),
    }),
    [container, onSnap],
  );
}

function start(gesture: Gesture, event: PointerEventLike): void {
  gesture.x = event.clientX;
  gesture.y = event.clientY;
  gesture.pressed = true;
  gesture.dragging = false;
  gesture.moved = false;
  capture(event, true);
}

/**
 * Capture keeps the island under a pointer that leaves the pill, and is an
 * improvement rather than the mechanism: a refused one leaves the drag working.
 */
function capture(event: PointerEventLike, take: boolean): void {
  const element = handle(event);
  try {
    if (take) element?.setPointerCapture(event.pointerId);
    else element?.releasePointerCapture(event.pointerId);
  } catch {
    return;
  }
}

/** Below the threshold this is still a click, and the island must not jump. */
function move(gesture: Gesture, event: PointerEventLike): void {
  const { node } = gesture;
  if (!node || !gesture.pressed) return;

  const dx = event.clientX - gesture.x;
  const dy = event.clientY - gesture.y;
  if (!gesture.dragging && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;

  gesture.dragging = true;
  gesture.moved = true;
  node.style.setProperty("--mk-x", `${String(Math.round(dx))}px`);
  node.style.setProperty("--mk-y", `${String(Math.round(dy))}px`);
  node.setAttribute(DRAGGING_ATTRIBUTE, "true");
}

/** The offset is dropped as the corner is set, so the island never moves twice. */
function end(
  gesture: Gesture,
  event: PointerEventLike,
  container: HTMLElement,
  onSnap: (corner: Corner) => void,
): void {
  const { node } = gesture;
  capture(event, false);
  gesture.pressed = false;
  if (!node || !gesture.dragging) return;

  gesture.dragging = false;
  const box = node.getBoundingClientRect();
  node.removeAttribute(DRAGGING_ATTRIBUTE);
  node.style.removeProperty("--mk-x");
  node.style.removeProperty("--mk-y");

  onSnap(nearestCorner(middleOf(box), container.getBoundingClientRect()));
}

/** Where the island was let go, which is the point the corner is read from. */
function middleOf(box: DOMRect): { x: number; y: number } {
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

/** The element the capture is on: the pill, which is the island's handle. */
function handle(event: PointerEventLike): Element | null {
  const target = event.currentTarget;
  return target instanceof Element ? target : null;
}
