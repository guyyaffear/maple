import { createElement, createRef } from "react";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import { AsChildError, composeRefs, mergeProps, Slot } from "../src/index.js";

/**
 * The merge is a merge: both handlers fire, both class names survive and both
 * refs are called, so a caller's button keeps its focus ring and its analytics.
 */
describe("asChild", () => {
  it("forwards the part's props onto the caller's element", async () => {
    await render(
      createElement(
        Slot,
        { "data-status": "open", className: "part" } as never,
        createElement("button", { className: "mine", type: "button" }, "Comment"),
      ),
    );

    const button = document.querySelector("button")!;
    expect(button.getAttribute("data-status")).toBe("open");
    expect(button.className).toBe("part mine");
    expect(button.textContent).toBe("Comment");
  });

  it("calls both handlers, the part's first", async () => {
    const order: string[] = [];
    await render(
      createElement(
        Slot,
        { onClick: () => order.push("part") },
        createElement("button", { type: "button", onClick: () => order.push("caller") }, "Go"),
      ),
    );

    document.querySelector("button")!.click();
    expect(order).toEqual(["part", "caller"]);
  });

  it("calls both refs, so the caller keeps its own handle", async () => {
    const part = createRef<HTMLButtonElement>();
    const caller = createRef<HTMLButtonElement>();

    await render(
      createElement(
        Slot,
        { ref: part } as never,
        createElement("button", { ref: caller, type: "button" }, "Go"),
      ),
    );

    expect(part.current).toBeInstanceOf(HTMLButtonElement);
    expect(part.current).toBe(caller.current);
  });

  it("keeps the caller's element focusable, and its focus ring with it", async () => {
    await render(
      createElement(
        Slot,
        { className: "part" } as never,
        createElement("button", { type: "button", id: "focusable" }, "Go"),
      ),
    );

    const button = document.querySelector<HTMLButtonElement>("#focusable")!;
    button.focus();

    expect(document.activeElement).toBe(button);
  });

  it("says what went wrong when it was given anything but one element", async () => {
    await expect(render(createElement(Slot, null, "just text"))).rejects.toThrow(AsChildError);
  });
});

describe("merging", () => {
  it.each([
    ["className", { className: "a" }, { className: "b" }, { className: "a b" }],
    ["style", { style: { top: 1 } }, { style: { left: 2 } }, { style: { top: 1, left: 2 } }],
    ["a plain prop", { title: "part" }, { title: "caller" }, { title: "caller" }],
    ["an absent prop", { title: "part" }, {}, { title: "part" }],
  ])("merges %s", (_what, part, caller, expected) => {
    expect(mergeProps(part, caller)).toMatchObject(expected);
  });

  it("composes refs of both kinds", () => {
    const object = createRef<HTMLElement>();
    const seen: (HTMLElement | null)[] = [];
    const element = document.createElement("div");

    composeRefs<HTMLElement>(object, (node) => {
      seen.push(node);
    })(element);

    expect(object.current).toBe(element);
    expect(seen).toEqual([element]);
  });

  it("survives a ref that was never given", () => {
    expect(() => composeRefs<HTMLElement>(undefined, null)(null)).not.toThrow();
  });
});
