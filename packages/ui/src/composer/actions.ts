/**
 * `Maple.Actions`: send, or leave it. Nothing here throws a draft away.
 *
 * Cancel closes the composer and the unsent comment stays where it was; only a
 * send clears one. Send is disabled while the body is blank and while a send
 * is in flight, so a double click cannot post twice.
 */

import { useMaple, useMapleClient } from "@maple-kit/react";
import { createElement, forwardRef } from "react";

import { Slot } from "../slot.js";
import { useComposerScope } from "./scope.js";

import type { AsChildProps } from "../slot.js";
import type { ReactNode } from "react";

/** The footer. `children` lead it: that is where developer detail lands. */
export interface MapleActionsProps extends AsChildProps {
  readonly className?: string;
  readonly children?: ReactNode;
}

/** Leaves the draft where it is. */
export const CANCEL_LABEL = "Cancel";

/** The noun: it is what the reviewer is making. */
export const SEND_LABEL = "Comment";

/** The two controls, and room beside them for a later one. */
export const MapleActions = /** @__PURE__ */ forwardRef<HTMLElement, MapleActionsProps>(
  function MapleActions(props, ref) {
    const { composer } = useMaple();
    const client = useMapleClient();
    const scope = useComposerScope("Maple.Actions");
    const Element = (props.asChild ? Slot : "footer") as "footer";

    const send = (): void => {
      void client.send().then(
        () => scope.clear(),
        () => undefined,
      );
    };

    return createElement(
      Element,
      {
        ref,
        className: props.className ? `mk-composer-foot ${props.className}` : "mk-composer-foot",
      },
      props.children,
      createElement("span", { className: "mk-composer-fill" }),
      createElement(
        "button",
        {
          type: "button",
          className: "mk-btn mk-btn-quiet mk-press",
          onClick: () => client.closeComposer(),
        },
        CANCEL_LABEL,
      ),
      createElement(
        "button",
        {
          type: "button",
          className: "mk-btn mk-btn-primary mk-press",
          disabled: composer.body.trim() === "" || composer.sending,
          onClick: send,
        },
        SEND_LABEL,
      ),
    );
  },
);
