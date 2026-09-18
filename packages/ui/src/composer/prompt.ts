/**
 * The one dialog Maple shows, and the only thing it may be about.
 *
 * A modal that stops a reviewer clicking a link is worse than a comment that
 * comes back by itself, so three of the four draft layers save and get out of
 * the way. This is the fourth, and it names what is at stake.
 */

import { createElement, useEffect, useRef, useState, useSyncExternalStore } from "react";

import { LEAVE_DISCARD, LEAVE_KEEP, leaveMessage } from "./phrase.js";

import type { LeaveAsk } from "./leave.js";
import type { LeaveQuestion } from "@maple-kit/core/client";
import type { ReactElement } from "react";

interface LeavePromptProps {
  readonly ask: LeaveAsk;
}

/** Keeps the last question on screen while it leaves, so it is not a jump. */
export function LeavePrompt(props: LeavePromptProps): ReactElement | null {
  const { ask } = props;
  const question = useSyncExternalStore(ask.subscribe, ask.pending, ask.pending);
  const [shown, setShown] = useState<LeaveQuestion | undefined>(question);
  const keep = useRef<HTMLButtonElement>(null);

  if (question !== undefined && question !== shown) setShown(question);

  useEffect(() => {
    if (question) keep.current?.focus();
  }, [question]);

  if (!shown) return null;

  return createElement(
    "div",
    {
      className: "mk-leave",
      "data-mk-open": String(question !== undefined),
      role: "alertdialog",
      "aria-label": leaveMessage(shown.subject),
    },
    createElement("p", { className: "mk-leave-say mk-body" }, leaveMessage(shown.subject)),
    createElement(
      "div",
      { className: "mk-leave-ask" },
      createElement(
        "button",
        {
          type: "button",
          className: "mk-btn mk-btn-quiet mk-press",
          onClick: () => ask.answer("discard"),
        },
        LEAVE_DISCARD,
      ),
      createElement(
        "button",
        {
          type: "button",
          ref: keep,
          className: "mk-btn mk-btn-primary mk-press",
          onClick: () => ask.answer("keep"),
        },
        LEAVE_KEEP,
      ),
    ),
  );
}
