import { describe, expect, it } from "vitest";

import { dedupe, DEFAULT_VIEWPORTS } from "../src/rendered/audit.js";

import type { Finding } from "../src/types.js";

const PHONE = { width: 375, height: 812 };
const LAPTOP = { width: 1440, height: 900 };

function finding(over: Partial<Finding> = {}): Finding {
  return {
    rule: "maple/rendered-touch-target",
    tier: "rendered",
    severity: "error",
    message: "This button is 20×20px, under the 24px touch target.",
    anchor: { selector: "button:nth-of-type(1)" },
    ...over,
  };
}

describe("dedupe", () => {
  it("reports a finding present at every viewport once, unchanged", () => {
    const passes = [
      { viewport: PHONE, findings: [finding()] },
      { viewport: LAPTOP, findings: [finding()] },
    ];
    expect(dedupe(passes)).toEqual([finding()]);
  });

  it("names the viewports when a finding is not at all of them", () => {
    const passes = [
      { viewport: PHONE, findings: [finding()] },
      { viewport: LAPTOP, findings: [] },
    ];
    expect(dedupe(passes)[0]!.message).toContain("At 375×812.");
  });

  it("keeps two findings on one element apart when the rules differ", () => {
    const passes = [
      { viewport: PHONE, findings: [finding(), finding({ rule: "maple/rendered-contrast" })] },
    ];
    expect(dedupe(passes)).toHaveLength(2);
  });

  it("keeps one rule's findings apart when they are on different elements", () => {
    const passes = [
      {
        viewport: PHONE,
        findings: [finding(), finding({ anchor: { selector: "button:nth-of-type(2)" } })],
      },
    ];
    expect(dedupe(passes)).toHaveLength(2);
  });

  it("is empty for a clean run", () => {
    expect(dedupe([{ viewport: PHONE, findings: [] }])).toEqual([]);
  });
});

describe("the default viewports", () => {
  it("covers a phone, a tablet and a laptop", () => {
    expect(DEFAULT_VIEWPORTS.map((viewport) => viewport.width)).toEqual([375, 768, 1440]);
  });
});
