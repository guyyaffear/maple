import { describe, expect, it } from "vitest";

import {
  COLLISION_GAP_PX,
  COLLISION_MAX_TRIES,
  COLLISION_STEP_PX,
  initialsOf,
  kindPhrase,
  LEAF_OUTLINE,
  LEAF_ROTATION,
  LEAF_SOLID,
  LEAF_VIEW_BOX,
  MARK_HIT_PX,
  MARK_SIZE_PX,
  markLabel,
  marksCss,
  markTitle,
  NOTHING_NAMED,
  waterline,
} from "../src/marks/index.js";
import {
  COLOR_TOKENS,
  MOTION_TOKENS,
  RADIUS_TOKENS,
  RUNTIME_TOKENS,
  SHADOW_TOKENS,
  SIZE_TOKENS,
  TYPE_TOKENS,
} from "../src/tokens.js";

import type { PickKind } from "@maple-kit/core/client";

/** True for a token the base sheet already declares on `:host`. */
function inTokens(name: string): boolean {
  return [COLOR_TOKENS, MOTION_TOKENS, RADIUS_TOKENS, SHADOW_TOKENS, SIZE_TOKENS, TYPE_TOKENS].some(
    (table) => name in table,
  );
}

describe("the leaf", () => {
  it("uses the rotated bounding box, or a 20-degree tilt clips the tips", () => {
    expect(LEAF_VIEW_BOX).toBe("-7 -7 78 78");
    expect(LEAF_ROTATION).toBe("rotate(20 32 32)");
  });

  it("gives the outline a counter, so it needs no stroke to read as a ring", () => {
    expect(LEAF_SOLID.match(/z/gi)).toHaveLength(1);
    expect(LEAF_OUTLINE.match(/z/gi)).toHaveLength(2);
  });
});

/** The clip sits outside the rotation, so the waterline stays horizontal. */
describe("the half-filled form", () => {
  it.each([
    [0.5, 39, 32],
    [0.55, 42.9, 28.1],
    [1, 78, -7],
    [0, 0, 71],
  ])("clips %d of the leaf", (fraction, height, top) => {
    const rect = waterline(fraction);
    expect(rect.height).toBeCloseTo(height, 5);
    expect(rect.y).toBeCloseTo(top, 5);
    expect(rect.x).toBe(-7);
    expect(rect.width).toBe(78);
  });

  it("clamps a fraction outside the leaf rather than drawing past it", () => {
    expect(waterline(2)).toEqual(waterline(1));
    expect(waterline(-1)).toEqual(waterline(0));
  });
});

describe("the collision resolver's numbers", () => {
  it("steps further than it tests, so two hit areas never overlap", () => {
    expect(COLLISION_STEP_PX).toBeGreaterThan(COLLISION_GAP_PX);
  });

  it("gives up after three, because a fourth is further than it is worth", () => {
    expect(COLLISION_MAX_TRIES).toBe(3);
  });

  it("hits larger than it draws", () => {
    expect(MARK_HIT_PX).toBeGreaterThanOrEqual(40);
    expect(MARK_HIT_PX).toBeGreaterThan(MARK_SIZE_PX);
  });
});

describe("the words", () => {
  it.each([
    ["element", "the Yield card", "the Yield card"],
    ["text", "the retention paragraph", "a passage in the retention paragraph"],
    ["region", "the settings panel", "an area of the settings panel"],
  ])("phrases a %s", (kind, human, expected) => {
    expect(kindPhrase(kind as PickKind, human)).toBe(expected);
  });

  it.each(["element", "text", "region"])("falls back to the page for a %s", (kind) => {
    expect(kindPhrase(kind as PickKind, undefined)).toBe(NOTHING_NAMED);
  });

  it("names the mark without a stray separator when nobody is known", () => {
    expect(markTitle(undefined, "open", "the Yield card")).toBe("Open · the Yield card");
    expect(markTitle("Sam", "resolved")).toBe("Sam · Resolved");
    expect(markLabel(3, "Priya", "needs_reverify")).toBe("Comment 3 by Priya, Needs re-verify");
    expect(markLabel(3, undefined, "open")).toBe("Comment 3, Open");
  });

  it("reduces a name to two initials, and never says the word guest", () => {
    expect(initialsOf("Reviewer A")).toBe("RA");
    expect(initialsOf("noor")).toBe("N");
    expect(initialsOf("Ada Blake Chen")).toBe("AB");
  });
});

/**
 * The marks' half of the sheet answers to the same rules as the base: motion
 * only through tokens, and no class that assumes anything of the host page.
 */
describe("the marks' stylesheet", () => {
  const CSS = marksCss();
  const literals = CSS.split("\n").map((line) => line.replace(/var\(--mk-[\w-]+\)/g, ""));

  it.each([
    ["a duration", /\b\d+m?s\b/],
    ["an easing curve", /cubic-bezier|\bease(-in|-out|-in-out)?\b|\bsteps\(/],
  ])("has no rule spelling %s", (_what, pattern) => {
    expect(literals.filter((line) => pattern.test(line))).toEqual([]);
  });

  it("never transitions all, and never transitions a position", () => {
    expect(CSS).not.toMatch(/transition:\s*all/);
    for (const [, properties] of CSS.matchAll(/transition:([^;]+);/g)) {
      expect(properties).not.toMatch(/translate|\btop\b|\bleft\b|width|height/);
    }
  });

  it("gives the ring an opacity transition and nothing else", () => {
    const ring = /\.mk-ring \{([^}]*)\}/.exec(CSS)?.[1] ?? "";
    expect(ring).toMatch(/transition: opacity var\(--mk-dur-fade\) var\(--mk-ease-surface\);/);
    expect(ring.match(/transition:/g)).toHaveLength(1);
  });

  it("wills change only while something is moving, and only what may move", () => {
    const blocks = CSS.split("}").filter((block) => block.includes("will-change"));
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toContain("[data-mk-moving]");
    expect(blocks[0]).toContain("will-change: transform;");
  });

  it("assumes no host class, because none exists inside the shadow root", () => {
    const classes = [...CSS.matchAll(/\.([a-z][\w-]*)/g)].map((match) => match[1]!);
    expect(classes.filter((name) => !name.startsWith("mk-"))).toEqual([]);
  });

  it("declares every token it reads, or has it arrive through setProperty", () => {
    const declared = new Set([...CSS.matchAll(/^ *(--mk-[\w-]+):/gm)].map((match) => match[1]!));
    const read = [...CSS.matchAll(/var\((--mk-[\w-]+)/g)].map((match) => match[1]!);
    const missing = read.filter(
      (name) => !declared.has(name) && !RUNTIME_TOKENS.includes(name) && !inTokens(name),
    );
    expect(missing).toEqual([]);
  });
});
