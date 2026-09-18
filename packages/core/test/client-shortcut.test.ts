import { describe, expect, it } from "vitest";

import { isEditable, opensComposer } from "../src/client/index.js";

import type { ShortcutEvent } from "../src/client/index.js";

function press(overrides: Partial<ShortcutEvent> = {}): ShortcutEvent {
  return { key: "c", ...overrides };
}

/**
 * The trap this exists for: the first build fired on the key alone, so copying
 * a paragraph with Ctrl+C closed the composer the reviewer was writing in.
 */
describe("the c shortcut", () => {
  const cases: Array<[string, ShortcutEvent, boolean]> = [
    ["a bare c", press(), true],
    ["an uppercase C", press({ key: "C" }), true],
    ["another letter", press({ key: "v" }), false],
    ["cmd+c, which is copy", press({ metaKey: true }), false],
    ["ctrl+c, which is copy", press({ ctrlKey: true }), false],
    ["alt+c, which is a character", press({ altKey: true }), false],
    ["a key something already handled", press({ defaultPrevented: true }), false],
    ["c typed into an input", press({ target: { tagName: "INPUT" } }), false],
    ["c typed into a textarea", press({ target: { tagName: "textarea" } }), false],
    ["c typed into a rich editor", press({ target: { isContentEditable: true } }), false],
    ["c over plain text", press({ target: { tagName: "P" } }), true],
  ];

  it.each(cases)("%s: %o opens the composer = %s", (_name, event, expected) => {
    expect(opensComposer(event)).toBe(expected);
  });
});

describe("where a person could be typing", () => {
  it("reads contenteditable from the attribute as well as the property", () => {
    const editable = { getAttribute: (name: string) => (name === "contenteditable" ? "" : null) };
    expect(isEditable(editable)).toBe(true);
  });

  it("does not treat contenteditable=false as typing", () => {
    const plain = { getAttribute: () => "false" };
    expect(isEditable(plain)).toBe(false);
  });

  it("survives a target that is not an element at all", () => {
    expect(isEditable(null)).toBe(false);
    expect(isEditable(globalThis)).toBe(false);
  });
});

describe("an application that chose another key", () => {
  it.each([
    ["k", { key: "k" }, true],
    ["k", { key: "K" }, true],
    ["k", { key: "c" }, false],
    ["k", { key: "k", ctrlKey: true }, false],
  ])("answers to %s and to nothing else", (key, event, expected) => {
    expect(opensComposer(event, key)).toBe(expected);
  });
});
