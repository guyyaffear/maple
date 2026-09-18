/**
 * `Maple.Body`: the one field, and a placeholder that asks for a problem.
 *
 * Every keystroke reaches the controller, which debounces it into the draft
 * store, so an unsent comment survives a reload without this part knowing
 * storage exists.
 */

import { useMaple, useMapleClient } from "@maple-kit/react";
import { createElement, forwardRef, useEffect, useRef } from "react";

import { composeRefs, Slot } from "../slot.js";

import type { AsChildProps } from "../slot.js";
import type { ChangeEvent } from "react";

/** The field. `asChild` hands it to an application's own textarea. */
export interface MapleBodyProps extends AsChildProps {
  readonly className?: string;
}

/** It asks for a problem rather than for a comment. */
export const COMPOSER_PLACEHOLDER = "What is wrong with this?";

/** The comment itself. Focused on open; never cleared by a close. */
export const MapleBody = /** @__PURE__ */ forwardRef<HTMLTextAreaElement, MapleBodyProps>(
  function MapleBody(props, ref) {
    const { composer } = useMaple();
    const client = useMapleClient();
    const field = useRef<HTMLTextAreaElement>(null);
    // `Slot` renders the caller's element, so the part's own props are typed
    // against the element it would otherwise have rendered.
    const Element = (props.asChild ? Slot : "textarea") as "textarea";

    useEffect(() => {
      if (composer.open) field.current?.focus();
    }, [composer.open]);

    const className = ["mk-composer-row", "mk-field", "mk-body", props.className];

    return createElement(Element, {
      ref: composeRefs<HTMLTextAreaElement>(ref, field),
      className: className.filter(Boolean).join(" "),
      value: composer.body,
      placeholder: COMPOSER_PLACEHOLDER,
      "aria-label": COMPOSER_PLACEHOLDER,
      onChange: (event: ChangeEvent<HTMLTextAreaElement>) => client.setBody(event.target.value),
    });
  },
);
