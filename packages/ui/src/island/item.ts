/**
 * `Maple.Item`: one comment, as a row.
 *
 * Default detail is the default: who, when, what they said, and what it is on
 * in the words a reviewer would use. The rung, the confidence, the source line
 * and the CSS path are developer detail and are absent until it is on. The
 * status chip is drawn only when the status is not open, which is the ordinary
 * case and does not need saying.
 */

import { labelFor } from "@maple-kit/core/anchor";
import { forwardRef, useState } from "react";

import { dataAttributes } from "../data.js";
import { STATUS_LABELS } from "../language.js";
import { applyReviewerSlot } from "../slots.js";
import { kindOf } from "./comments.js";
import { useIsland } from "./context.js";
import { ISLAND_COPY, kindPhrase, ORPHAN_LABELS, orphanTitle } from "./language.js";
import { Leaf } from "./leaf.js";
import { cx, renderPart } from "./part.js";
import { relativeTime } from "./time.js";

import type { PartProps } from "./part.js";
import type { Comment, CommentAuthor } from "@maple-kit/core";
import type { OrphanReason } from "@maple-kit/core/anchor";
import type { ReactNode } from "react";

/** One comment. The row renders it; it takes no view of its own. */
export interface ItemProps extends PartProps {
  readonly comment: Comment;
}

/** Bodies longer than this are clamped, with the rest one click away. */
const LONG_BODY = 150;

const PART = "<Maple.Item>";

/** A row: who and when, what they said, and what it is on. */
export const Item = /** @__PURE__ */ forwardRef<HTMLElement, ItemProps>(function Item(props, ref) {
  const { asChild, className, comment, ...rest } = props;
  const island = useIsland(PART);
  const [expanded, setExpanded] = useState(false);

  const long = comment.body.length > LONG_BODY;
  const number = island.numbers.get(comment.id) ?? 0;

  return renderPart(
    "article",
    asChild,
    {
      ...dataAttributes({ status: comment.status }),
      ...rest,
      "data-mk-expanded": String(expanded),
      className: cx("mk-row", className),
      ref,
    },
    [
      top(comment, number),
      renderPart("p", false, { key: "body", className: "mk-text mk-body" }, comment.body),
      long ? more(expanded, () => setExpanded(!expanded)) : null,
      meta(comment, island.orphans.get(comment.id)),
    ],
  );
});

/** The toggle under a clamped body. Its words say what the next click does. */
function more(expanded: boolean, onClick: () => void): ReactNode {
  const label = expanded ? ISLAND_COPY.showLess : ISLAND_COPY.showAll;
  return renderPart(
    "button",
    false,
    { key: "more", type: "button", className: "mk-more", onClick },
    label,
  );
}

/** Who wrote it, when, and its place on the branch. */
function top(comment: Comment, number: number): ReactNode {
  const chip =
    comment.status === "open"
      ? null
      : renderPart(
          "span",
          false,
          { key: "status", className: cx("mk-chip", chipTone(comment)) },
          STATUS_LABELS[comment.status],
        );

  return renderPart("div", false, { key: "top", className: "mk-row-top" }, [
    who(comment),
    chip,
    renderPart("span", false, { key: "n", className: "mk-index" }, `#${String(number)}`),
  ]);
}

function chipTone(comment: Comment): string {
  if (comment.status === "resolved") return "mk-chip-ok";
  return comment.status === "orphaned" ? "mk-chip-lost" : "mk-chip-warn";
}

/** The avatar, the name and how long ago, all softened when unverified. */
function who(comment: Comment): ReactNode {
  const { author } = comment;

  return renderPart(
    "span",
    false,
    { key: "who", className: "mk-who", ...dataAttributes({ provenance: author.provenance }) },
    [
      avatar(author),
      renderPart("span", false, { key: "name", className: "mk-name" }, author.name),
      renderPart(
        "span",
        false,
        { key: "when", className: "mk-when" },
        relativeTime(comment.createdAt, Date.now()),
      ),
    ],
  );
}

/** The leaf, in the reviewer's own colour, with their initials over it. */
function avatar(author: CommentAuthor): ReactNode {
  const slot = author.colorSlot ?? 0;

  return renderPart(
    "span",
    false,
    {
      key: "avatar",
      className: "mk-avatar",
      ...dataAttributes({ provenance: author.provenance }),
      title: avatarTitle(author),
      ref: (node: HTMLElement | null) => {
        if (node) applyReviewerSlot(node, slot);
      },
    },
    [
      renderPart(Leaf, false, { key: "leaf", size: 21 }),
      renderPart("span", false, { key: "ini", className: "mk-initials" }, initials(author.name)),
    ],
  );
}

/** How much the identity is worth, in a sentence rather than a warning. */
function avatarTitle(author: CommentAuthor): string {
  const { name } = author;
  if (author.provenance === "server") return `${name} — verified by the application's own session`;
  if (author.provenance === "client") return `${name} — the application told us; unverified`;
  return `${name} — typed a name into Maple`;
}

function initials(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  const letters = words.slice(0, 2).map((word) => word.charAt(0));
  return letters.join("").toUpperCase() || "?";
}

/** What it is on, or why it has nowhere to be, and whether a shot came with it. */
function meta(comment: Comment, reason: OrphanReason | undefined): ReactNode {
  const attachments = comment.attachments?.length ?? 0;

  return renderPart("div", false, { key: "meta", className: "mk-meta" }, [
    reason === undefined ? place(comment) : lost(reason),
    attachments > 0
      ? renderPart("span", false, { key: "shot", className: "mk-chip" }, ISLAND_COPY.attachment)
      : null,
  ]);
}

function place(comment: Comment): ReactNode {
  const phrase = kindPhrase(kindOf(comment.anchor), labelFor({ anchor: comment.anchor }));
  return renderPart("span", false, { key: "on", className: "mk-when" }, [
    "on ",
    renderPart("b", false, { key: "b" }, phrase),
  ]);
}

function lost(reason: OrphanReason): ReactNode {
  return renderPart(
    "span",
    false,
    { key: "lost", className: "mk-chip mk-chip-lost", title: orphanTitle(reason) },
    ORPHAN_LABELS[reason],
  );
}
