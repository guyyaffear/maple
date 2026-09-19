/**
 * Every mark on the page, and the ring that says which one is being answered.
 *
 * One loop measures and moves all of them per scrolled frame, and the
 * collision resolver steps a mark sideways until its hit area clears its
 * neighbours' — two marks a thumb cannot tell apart are two marks that get
 * clicked wrong. Marks are drawn from the filter's list; the addresses are not.
 */

import { resolveAnchor, sourceFor } from "@maple-kit/core/anchor";
import { useMaple, useMapleClient } from "@maple-kit/react";
import { createElement, forwardRef, useCallback, useEffect, useMemo, useRef } from "react";

import { useMapleUi } from "../context.js";
import { useFrameLoop, viewportHeight } from "./frame.js";
import { culled, markSpot, placeMark } from "./geometry.js";
import { ringLabel } from "./label.js";
import { MapleMark } from "./mark.js";
import { flag, OFF_ATTRIBUTE, place } from "./paint.js";
import { addresses, kindOf, placements } from "./placement.js";
import { MapleTargetRing } from "./ring.js";

import type { Box } from "./geometry.js";
import type { Placement } from "./placement.js";
import type { RingState, TargetRingProps } from "./ring.js";
import type { Comment } from "@maple-kit/core";
import type { LabelSource } from "@maple-kit/core/anchor";
import type { ClientState, ComposerTarget, Detail } from "@maple-kit/core/client";

const PART = "Maple.MarkLayer";

/** What the layer draws. Both lists default to the controller's own. */
export interface MarkLayerProps {
  /** Everything on the branch: what the addresses are counted from. */
  readonly comments?: readonly Comment[];
  /** The ones to draw. Defaults to what the current filter shows. */
  readonly visible?: readonly Comment[];
  readonly selectedId?: string;
  /** What a click does. Defaults to opening the comment, which is the point. */
  readonly onSelect?: (comment: Comment) => void;
  readonly className?: string;
}

/** The marks, and the one ring they share. */
export const MapleMarkLayer = /** @__PURE__ */ forwardRef<HTMLDivElement, MarkLayerProps>(
  function MapleMarkLayer(props, ref) {
    const { className } = props;
    const { container } = useMapleUi(PART);
    const state = useMaple();
    const client = useMapleClient();
    const chosen = props.onSelect;
    const onSelect = useCallback(
      (comment: Comment) => {
        if (chosen) return chosen(comment);
        client.viewComment(comment.id);
      },
      [chosen, client],
    );

    const comments = props.comments ?? state.comments;
    const visible = props.visible ?? state.visible;
    const selectedId = props.selectedId ?? state.selected ?? undefined;
    const peeked = state.peeked ?? undefined;
    const address = useMemo(() => addresses(comments), [comments]);
    const placed = useMemo(
      () => placements(visible, address, container.ownerDocument),
      [visible, address, container],
    );

    const nodes = useRef(new Map<string, HTMLButtonElement>());
    const paint = useCallback(() => {
      const height = viewportHeight(container);
      const taken: Box[] = [];
      for (const placement of placed) {
        const node = nodes.current.get(placement.comment.id);
        if (node) taken.push(step(node, placement, { height, taken }));
      }
    }, [container, placed]);

    useFrameLoop(PART, paint);
    useScrollTo(placed, selectedId);

    // Memoised so a keystroke in the composer re-renders the ring and not
    // thirty marks, each of which measures an element to draw itself.
    const marks = useMemo(
      () =>
        placed.map((placement) =>
          createElement(MapleMark, {
            ...markProps(placement, selectedId),
            key: placement.comment.id,
            ref: keep(nodes.current, placement.comment.id),
            onClick: () => onSelect(placement.comment),
            onPointerEnter: () => client.peek(placement.comment.id),
            onPointerLeave: () => client.peek(null),
            onFocus: () => client.peek(placement.comment.id),
            onBlur: () => client.peek(null),
          }),
        ),
      [client, onSelect, placed, selectedId],
    );

    return createElement(
      "div",
      { className: className ? `mk-marks ${className}` : "mk-marks", ref },
      ...marks,
      createElement(
        MapleTargetRing,
        ringFor({
          client: state,
          placed,
          pointing: { peeked, selected: selectedId },
          root: container.ownerDocument,
        }),
      ),
    );
  },
);

/**
 * A link naming a comment has to land on it: the island opens, the ring is
 * drawn, and the page moves to what it is about rather than asking anyone to.
 */
function useScrollTo(placed: readonly Placement[], selectedId: string | undefined): void {
  const found = placed.find((placement) => placement.comment.id === selectedId);
  const target = found?.element;

  useEffect(() => {
    target?.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
  }, [target]);
}

/** What one frame does to one mark: cull it, or clear it of its neighbours. */
function step(
  node: HTMLButtonElement,
  placement: Placement,
  frame: { readonly height: number; readonly taken: readonly Box[] },
): Box {
  const rect = placement.element.getBoundingClientRect();
  const away = culled(rect, frame.height);
  flag(node, OFF_ATTRIBUTE, away);

  const spot = placeMark(markSpot(rect), frame.taken);
  if (!away) place(node, spot);
  return spot;
}

/** Keeps the node a frame will move. One callback per id, so refs stay stable. */
function keep(nodes: Map<string, HTMLButtonElement>, id: string) {
  return (node: HTMLButtonElement | null) => {
    if (node) nodes.set(id, node);
    else nodes.delete(id);
  };
}

/** Everything the mark reads off the comment it stands for. */
function markProps(placement: Placement, selectedId: string | undefined) {
  const { comment } = placement;
  return {
    address: placement.address,
    status: comment.status,
    confidence: placement.confidence,
    author: comment.author.name,
    on: ringLabel({ kind: kindOf(comment.anchor), element: placement.element }),
    selected: comment.id === selectedId,
    ...(comment.author.colorSlot === undefined ? {} : { colorSlot: comment.author.colorSlot }),
  };
}

/** Which comment each of the two pointers is on, neither of them the composer's. */
interface Pointing {
  readonly peeked: string | undefined;
  readonly selected: string | undefined;
}

/** What the ring is decided from: what is pointed at, then the composer. */
interface RingInput {
  readonly client: ClientState;
  readonly placed: readonly Placement[];
  readonly pointing: Pointing;
  readonly root: ParentNode;
}

/**
 * A pointer wins, because a peek gives the ring straight back; then the
 * composer; then the click, which is what holds it after the hand has gone.
 */
function ringFor(input: RingInput): TargetRingProps {
  const peeked = marked(input, input.pointing.peeked, "hovered");
  if (peeked) return peeked;

  const { composer } = input.client;
  if (composer.open && composer.target) return composing(composer.target, input);

  return marked(input, input.pointing.selected, "selected") ?? {};
}

/** The ring around one drawn mark, or nothing when the page has no such mark. */
function marked(input: RingInput, id: string | undefined, state: RingState) {
  const hit = input.placed.find((placement) => placement.comment.id === id);
  if (!hit) return undefined;

  return {
    target: hit.range ?? hit.element,
    label: ringLabel({ kind: kindOf(hit.comment.anchor), element: hit.element }),
    ...noteFor({ anchor: hit.comment.anchor, element: hit.element }, input.client.detail),
    state,
  };
}

/** A composer on something the page no longer has gets no ring, and no guess. */
function composing(target: ComposerTarget, input: RingInput): TargetRingProps {
  const found = resolveAnchor(target.anchor, { root: input.root, passage: target.kind === "text" });
  const label = ringLabel({
    kind: target.kind,
    anchor: target.anchor,
    ...(target.label === undefined ? {} : { named: target.label }),
    ...(found.status === "resolved" ? { element: found.element } : {}),
  });

  if (found.status !== "resolved") return {};
  return {
    target: found.range ?? found.element,
    label,
    ...noteFor({ anchor: target.anchor, element: found.element }, input.client.detail),
    // A panel opened on a comment is reading it, not answering it, and the
    // ring says which of the two the reader is looking at.
    state: input.client.composer.viewing === undefined ? "composing" : "selected",
  };
}

/**
 * Where the element is written, under the name it is known by. Developer
 * detail only: in default detail a path is noise over the page itself.
 */
function noteFor(source: LabelSource, detail: Detail): { note?: string } {
  const note = detail === "developer" ? sourceFor(source) : undefined;
  return note === undefined ? {} : { note };
}
