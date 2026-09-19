/**
 * The comments the demo starts with, anchored to elements the page has.
 *
 * An empty store is the least interesting state the overlay has, and the one a
 * first run always lands in: nothing to see means no marks, no counts and no
 * rows. Eleven cover every state the overlay draws differently — the four
 * statuses, the three provenances, the three picks, a weak anchor, two that
 * lost their place and two that carry the screenshot Maple took by itself — so
 * opening the example shows the whole vocabulary before anything is clicked.
 */

import type { AnchorRegion, MediaRef, NewComment } from "@maple-kit/core";

/** The page they were left on. The dev server is the only one there is. */
const CONTEXT = {
  url: "http://localhost:5173/",
  viewportWidth: 1440,
  viewportHeight: 900,
  contentWidth: 1232,
  devicePixelRatio: 2,
  colorScheme: "light",
  locale: "en-GB",
  breakpoint: "lg",
  regions: [{ role: "navigation", label: "Sections", width: 208 }],
} as const;

function at(hoursAgo: number): string {
  return new Date(Date.now() - hoursAgo * 3_600_000).toISOString();
}

/** A rectangle, as fractions of the element it was drawn inside. */
function area(x: number, y: number, width: number, height: number): AnchorRegion {
  return { x, y, width, height };
}

/** What Maple attached on its own at pick time. `resolve` in App.tsx reads it. */
function capture(key: string): readonly MediaRef[] {
  return [{ connector: "demo", key, contentType: "image/svg+xml", source: "capture" }];
}

/** Eleven, so every state the overlay draws differently is on the page. */
export function seedComments(branch: string): readonly NewComment[] {
  return [...open(), ...answered(), ...unpinned()].map((comment) => ({
    ...comment,
    branch,
    context: CONTEXT,
  }));
}

/** Nothing has claimed these yet, which is the ordinary state of a comment. */
function open(): readonly Omit<NewComment, "branch" | "context">[] {
  return [
    {
      body: "This delta is red for a drop in time-to-merge, which is the good direction. Flip the colour rule for this card.",
      createdAt: at(26),
      author: { id: "ada", name: "Ada Lovelace", provenance: "server", colorSlot: 6 },
      anchor: { component: "MetricCard", selector: ".metrics > .metric:nth-of-type(3)" },
    },
    {
      body: "Can this read “held until an agent resolves it” rather than naming the internal state? in_progress means nothing outside the code.",
      createdAt: at(22),
      author: { id: "grace", name: "Grace Hopper", provenance: "server", colorSlot: 0 },
      anchor: {
        component: "GateNotice",
        selector: ".notice p",
        quote: { exact: "until an agent resolves it" },
      },
    },
    {
      body: "The blocked pips are the same red as the down arrows above. One of the two should change.",
      createdAt: at(19),
      author: { id: "alan", name: "Alan Turing", provenance: "guest" },
      anchor: { component: "ReviewTable", selector: ".table-card table" },
    },
    {
      body: "The whole right-hand column is doing nothing between the chart and the notice. Either close the gap or let the chart have it.",
      createdAt: at(14),
      author: { id: "ivan", name: "Ivan Sutherland", provenance: "client", colorSlot: 3 },
      anchor: { component: "SplitRow", selector: ".split", region: area(0.34, 0.06, 0.62, 0.86) },
      attachments: capture("split-gap"),
    },
    {
      body: "Nothing on this item says it is a link until you are already on it. The hover state is the only affordance.",
      createdAt: at(9),
      author: { id: "barbara", name: "Barbara Liskov", provenance: "client", colorSlot: 8 },
      anchor: { selector: ".sidenav li:nth-child(3)" },
    },
  ];
}

/** Claimed, or claimed and then moved under: the two ends of a comment's life. */
function answered(): readonly Omit<NewComment, "branch" | "context">[] {
  return [
    {
      status: "resolved",
      body: "The bars have no scale at all. A reader cannot tell twelve from thirty.",
      createdAt: at(48),
      author: { id: "grace", name: "Grace Hopper", provenance: "server", colorSlot: 0 },
      anchor: { component: "ThroughputChart", selector: ".chart .bars" },
      resolution: { sha: "8f2c1ad", note: "Added a y-axis and a caption.", at: at(30) },
    },
    {
      status: "resolved",
      body: "“The gate landed in week seven” is the most useful sentence on this card and it is the smallest text on it.",
      createdAt: at(41),
      author: { id: "katherine", name: "Katherine Johnson", provenance: "server", colorSlot: 4 },
      anchor: {
        component: "ThroughputChart",
        selector: ".chart .metric-note",
        quote: { exact: "The gate landed in week seven." },
      },
      resolution: { sha: "1d40b7e", at: at(26) },
    },
    {
      status: "needs_reverify",
      body: "These four cards are four different heights because only one of them has a note. Give the row one height.",
      createdAt: at(33),
      author: { id: "ada", name: "Ada Lovelace", provenance: "server", colorSlot: 6 },
      anchor: {
        component: "MetricRow",
        selector: ".metrics",
        region: area(0.02, 0.1, 0.96, 0.8),
      },
      attachments: capture("metric-row"),
      resolution: { sha: "c07ee31", note: "Set a min-height on the card.", at: at(20) },
    },
    {
      status: "needs_reverify",
      body: "Daily is the default and there is no way to tell that from looking at it. Say so beside the field.",
      createdAt: at(11),
      author: { id: "alan", name: "Alan Turing", provenance: "guest" },
      anchor: { component: "SettingsForm", selector: ".form-card select" },
      resolution: { sha: "5ab9902", at: at(6) },
    },
  ];
}

/**
 * The page has nowhere to put these: one names a component that never shipped,
 * one quotes a sentence since rewritten. Both reasons a reviewer can act on.
 */
function unpinned(): readonly Omit<NewComment, "branch" | "context">[] {
  return [
    {
      status: "orphaned",
      body: "The trial banner covers the first metric on a 13-inch screen.",
      createdAt: at(56),
      author: { id: "ada", name: "Ada Lovelace", provenance: "server", colorSlot: 6 },
      anchor: { component: "TrialBanner", selector: ".trial-banner" },
    },
    {
      status: "orphaned",
      body: "“Rolling 28 days” and “vs. the 28 days before” are two names for one window. Pick one.",
      createdAt: at(51),
      author: { id: "grace", name: "Grace Hopper", provenance: "server", colorSlot: 0 },
      anchor: {
        component: "MetricCard",
        selector: ".metrics > .metric:nth-of-type(9)",
        quote: { exact: "Rolling 28 days, compared with the 28 before it" },
      },
    },
  ];
}
