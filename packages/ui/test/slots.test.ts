import { describe, expect, it } from "vitest";

import { applyReviewerSlot, REVIEWER_SLOT_COUNT, slotColor, slotInk } from "../src/slots.js";

describe("the ten reviewer slots", () => {
  it("has ten of them", () => {
    expect(REVIEWER_SLOT_COUNT).toBe(10);
  });

  it.each([
    [0, "oklch(0.63 0.13 22)", "oklch(0.99 0.01 22)"],
    [1, "oklch(0.77 0.12 62)", "oklch(0.22 0.03 62)"],
    [3, "oklch(0.76 0.11 146)", "oklch(0.22 0.03 146)"],
    [6, "oklch(0.62 0.13 252)", "oklch(0.99 0.01 252)"],
    [9, "oklch(0.75 0.12 350)", "oklch(0.22 0.03 350)"],
  ])("paints slot %i and its ink", (slot, color, ink) => {
    expect(slotColor(slot)).toBe(color);
    expect(slotInk(slot)).toBe(ink);
  });

  it("alternates lightness between neighbours, so two survive deuteranopia", () => {
    const lightness = Array.from({ length: REVIEWER_SLOT_COUNT }, (_unused, slot) =>
      Number(/oklch\(([\d.]+)/.exec(slotColor(slot))![1]),
    );
    for (let index = 1; index < lightness.length; index += 1) {
      expect(Math.abs(lightness[index]! - lightness[index - 1]!)).toBeGreaterThan(0.1);
    }
  });

  it.each([
    [10, 0],
    [23, 3],
    [-1, 9],
  ])("wraps slot %i onto %i rather than throwing", (given, expected) => {
    expect(slotColor(given)).toBe(slotColor(expected));
  });

  it("applies a slot as two properties and never as a rule", () => {
    const set: Record<string, string> = {};
    const element = {
      style: { setProperty: (name: string, value: string) => (set[name] = value) },
    };

    applyReviewerSlot(element as unknown as ElementCSSInlineStyle, 4);

    expect(set).toEqual({ "--mk-slot": slotColor(4), "--mk-slot-ink": slotInk(4) });
  });
});
