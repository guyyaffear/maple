/**
 * `Maple.Attachments`: paste and drop first, capture second.
 *
 * Client capture re-renders the DOM rather than reading the compositor, so it
 * is wrong on exactly the details people comment about. The preview is a
 * `blob:` URL, which is the single CSP directive Maple asks for.
 */

import { captureElement, imageIn } from "@maple-kit/core/screenshot";
import { useMapleClient } from "@maple-kit/react";
import { createElement, forwardRef, useEffect, useRef, useState } from "react";

import { Slot } from "../slot.js";
import { useComposerScope } from "./scope.js";

import type { AsChildProps } from "../slot.js";
import type { ComposerScopeValue } from "./scope.js";
import type { MediaRef } from "@maple-kit/core";
import type { PastedImage } from "@maple-kit/core/screenshot";
import type { ChangeEvent, ReactElement, ReactNode } from "react";

/** The strip. Both optional props are seams, not variants. */
export interface MapleAttachmentsProps extends AsChildProps {
  readonly className?: string;
  /** Puts the image wherever blobs live and returns the ref a comment keeps. */
  readonly upload?: (image: PastedImage) => Promise<MediaRef>;
  /** The element to capture, for a reviewer with no screenshot to paste. */
  readonly capture?: Element;
}

/** Every word this part shows, spelled once. */
export const ATTACH_WORDS = {
  offer: "Attach an image",
  hint: "or paste one",
  remove: "Remove",
  capture: "Capture it",
  alt: "Pasted screenshot preview",
  failed: "Could not attach that image.",
} as const;

/** The screenshot, before and after it is attached. */
export const MapleAttachments = /** @__PURE__ */ forwardRef<HTMLElement, MapleAttachmentsProps>(
  function MapleAttachments(props, ref) {
    const scope = useComposerScope("Maple.Attachments");
    const failed = useUpload(scope, props.upload);
    const picker = useRef<HTMLInputElement>(null);
    const Element = (props.asChild ? Slot : "div") as "div";

    const className = ["mk-composer-row", "mk-shots", props.className].filter(Boolean).join(" ");
    const children = scope.pending ? filled(scope, failed) : empty(scope, picker, props.capture);

    return createElement(Element, { ref, className }, ...children);
  },
);

/** The thumbnail, and the control that takes it off again. */
function filled(scope: ComposerScopeValue, failed: boolean): ReactNode[] {
  return [
    createElement("img", {
      key: "shot",
      className: "mk-shot",
      src: scope.pending?.preview.url,
      alt: ATTACH_WORDS.alt,
    }),
    createElement(
      "button",
      {
        key: "off",
        type: "button",
        className: "mk-btn mk-btn-quiet mk-press",
        onClick: scope.clear,
      },
      ATTACH_WORDS.remove,
    ),
    failed
      ? createElement("span", { key: "bad", className: "mk-chip" }, ATTACH_WORDS.failed)
      : null,
  ];
}

/** Paste works; the picker and capture sit beside it. */
function empty(
  scope: ComposerScopeValue,
  picker: React.RefObject<HTMLInputElement | null>,
  capture: Element | undefined,
): ReactNode[] {
  return [
    createElement("input", {
      key: "file",
      ref: picker,
      type: "file",
      accept: "image/*",
      hidden: true,
      onChange: (event: ChangeEvent<HTMLInputElement>) => onPicked(event, scope),
    }),
    createElement(
      "button",
      {
        key: "offer",
        type: "button",
        className: "mk-btn mk-press",
        onClick: () => picker.current?.click(),
      },
      ATTACH_WORDS.offer,
    ),
    createElement("span", { key: "hint", className: "mk-chip" }, ATTACH_WORDS.hint),
    capture ? createElement(Capture, { key: "shot", scope, element: capture }) : null,
  ];
}

function onPicked(event: ChangeEvent<HTMLInputElement>, scope: ComposerScopeValue): void {
  const image = imageIn(event.target.files);
  if (image) scope.offer(image);
}

interface CaptureProps {
  readonly scope: ComposerScopeValue;
  readonly element: Element;
}

/** `captureElement` asks snapdom for a PNG: its SVG default is a re-render. */
function Capture(props: CaptureProps): ReactElement {
  const take = (): void => {
    void captureElement(props.element).then(
      (blob) => props.scope.offer({ blob, type: blob.type }),
      () => undefined,
    );
  };

  return createElement(
    "button",
    { type: "button", className: "mk-btn mk-press", onClick: take },
    ATTACH_WORDS.capture,
  );
}

/** Uploads what was offered. Core has no route for it, so an application does. */
function useUpload(scope: ComposerScopeValue, upload: MapleAttachmentsProps["upload"]): boolean {
  const client = useMapleClient();
  const sent = useRef<PastedImage>(undefined);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const image = scope.pending?.image;
    if (!image || !upload || sent.current === image) return;

    sent.current = image;
    let live = true;
    const attached = (ref: MediaRef): void => {
      if (live) client.attach(ref);
    };
    const broke = (): void => {
      if (live) setFailed(true);
    };

    void upload(image).then(attached, broke);
    return () => {
      live = false;
    };
  }, [scope.pending, upload, client]);

  return failed;
}
