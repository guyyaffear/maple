import { describe, expect, it } from "vitest";

import { labelFor, unpickCamelCase } from "../src/anchor/label.js";

describe("unpicking a component name", () => {
  const cases: ReadonlyArray<readonly [string, string]> = [
    ["YieldCard", "Yield card"],
    ["DashboardHeader", "Dashboard header"],
    ["TableRowGroup", "Table row group"],
    ["Card", "Card"],
    ["APIKeyCard", "API key card"],
    ["UserAPIKey", "User API key"],
    ["HTML", "HTML"],
    ["yieldCard", "Yield card"],
    ["Chart2Panel", "Chart2 panel"],
    ["Nav_bar", "Nav bar"],
    ["nav-bar", "Nav bar"],
    ["RETENTION", "RETENTION"],
    ["Yield card", "Yield card"],
  ];

  it.each(cases)("reads %s as a noun phrase", (name, expected) => {
    expect(unpickCamelCase(name)).toBe(expected);
  });
});

describe("the label for a comment with no element left", () => {
  const cases: ReadonlyArray<readonly [string, string | undefined, string | undefined]> = [
    ["falls back to the component name", "YieldCard", "Yield card"],
    ["says nothing when the anchor recorded nothing", undefined, undefined],
    ["says nothing for an empty component name", "", undefined],
  ];

  it.each(cases)("%s", (_case, component, expected) => {
    expect(labelFor({ anchor: component === undefined ? {} : { component } })).toBe(expected);
  });

  it("says nothing when given neither an element nor an anchor", () => {
    expect(labelFor({})).toBeUndefined();
  });
});
