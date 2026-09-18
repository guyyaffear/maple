import { createMapleClient } from "@maple-kit/core/client";
import { createElement, useState } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import { MapleProvider, useMaple, useMapleClient, usePicker } from "../src/index.js";

import type { MapleClient } from "@maple-kit/core/client";
import type { ReactElement } from "react";

const BRANCH = "feat/x";

/** How many times each probe rendered, and how the controller was subscribed. */
interface Counts {
  picker: number;
  state: number;
  subscribes: number;
  unsubscribes: number;
}

let counts: Counts;
let client: MapleClient;

beforeEach(() => {
  localStorage.clear();
  counts = { picker: 0, state: 0, subscribes: 0, unsubscribes: 0 };
});

/**
 * A real controller, with its subscriptions counted. Spreading it copies the
 * closures it is made of, so nothing here stands in for behaviour.
 */
function counted(): MapleClient {
  const real = createMapleClient({ branch: BRANCH, debounceMs: 0 });
  return {
    ...real,
    subscribe(listener) {
      counts.subscribes += 1;
      const unsubscribe = real.subscribe(listener);
      return () => {
        counts.unsubscribes += 1;
        unsubscribe();
      };
    },
  };
}

function PickerProbe(): ReactElement {
  counts.picker += 1;
  const pick = usePicker();
  return createElement("span", { "data-testid": "picker" }, pick.kind ?? "idle");
}

function StateProbe(): ReactElement {
  counts.state += 1;
  const state = useMaple();
  return createElement("span", { "data-testid": "state" }, state.filter);
}

/** Hands the controller out to the test, and renders nothing of its own. */
function Handle(): null {
  client = useMapleClient();
  return null;
}

/** The probes under one parent, so a button press re-renders all of them. */
function Tree(): ReactElement {
  const [presses, bump] = useState(0);
  return createElement(
    "div",
    null,
    createElement(
      "button",
      { "data-testid": "rerender", onClick: () => bump(presses + 1) },
      "again",
    ),
    createElement("span", { "data-testid": "presses" }, String(presses)),
    createElement(Handle),
    createElement(PickerProbe),
    createElement(StateProbe),
  );
}

async function mount(
  props: { autoLoad?: boolean; client?: MapleClient } = {},
): Promise<Awaited<ReturnType<typeof render>>> {
  return render(
    createElement(
      MapleProvider,
      { options: { branch: BRANCH, debounceMs: 0 }, ...props },
      createElement(Tree),
    ),
  );
}

describe("a hook's subscription", () => {
  it("subscribes once per hook and gives every one of them back on unmount", async () => {
    const screen = await mount({ client: counted() });
    await expect.element(screen.getByTestId("picker")).toHaveTextContent("idle");

    expect(counts.subscribes).toBe(2);
    expect(counts.unsubscribes).toBe(0);

    await screen.unmount();
    expect(counts.unsubscribes).toBe(2);
  });

  it("does not resubscribe when the tree re-renders", async () => {
    const screen = await mount({ client: counted() });
    await expect.element(screen.getByTestId("picker")).toHaveTextContent("idle");
    const before = counts.subscribes;

    const renders = counts.picker;
    await screen.getByTestId("rerender").click();
    await expect.element(screen.getByTestId("presses")).toHaveTextContent("1");

    expect(counts.picker).toBeGreaterThan(renders);
    expect(counts.subscribes).toBe(before);
  });

  it("hears nothing after it is unmounted", async () => {
    const screen = await mount({ client: counted() });
    await expect.element(screen.getByTestId("picker")).toHaveTextContent("idle");
    const held = client;
    const before = counts.picker;

    await screen.unmount();
    held.arm("element");
    expect(counts.picker).toBe(before);
  });
});

/** The reason a mark does not re-render every time a filter button is pressed. */
describe("a change a hook does not read", () => {
  it("leaves a narrow hook alone while a wide one re-renders", async () => {
    const screen = await mount({ client: counted() });
    await expect.element(screen.getByTestId("state")).toHaveTextContent("all");
    const picker = counts.picker;
    const state = counts.state;

    client.setFilter("open");

    await expect.element(screen.getByTestId("state")).toHaveTextContent("open");
    expect(counts.state).toBeGreaterThan(state);
    expect(counts.picker).toBe(picker);
  });

  it("re-renders the narrow hook when its own slice moves", async () => {
    const screen = await mount({ client: counted() });
    await expect.element(screen.getByTestId("picker")).toHaveTextContent("idle");

    client.arm("region");
    await expect.element(screen.getByTestId("picker")).toHaveTextContent("region");
  });
});

/**
 * The provider owns only what it built: it starts that controller in an
 * effect, which is where every listener on the page comes from.
 */
describe("the controller the provider built", () => {
  it("is started, so the page's own c shortcut reaches it", async () => {
    const screen = await mount({ autoLoad: false });
    await expect.element(screen.getByTestId("picker")).toHaveTextContent("idle");

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "c", bubbles: true }));
    await expect.element(screen.getByTestId("picker")).toHaveTextContent("element");
  });

  it("asks the route for the branch on mount, and does not when told not to", async () => {
    let calls = 0;
    const fetching = (): Promise<Response> => {
      calls += 1;
      return Promise.resolve(Response.json({ comments: [] }));
    };

    const quiet = await render(
      createElement(
        MapleProvider,
        { autoLoad: false, options: { branch: BRANCH, fetch: fetching } },
        createElement(StateProbe),
      ),
    );
    await expect.element(quiet.getByTestId("state")).toHaveTextContent("all");
    expect(calls).toBe(0);
    await quiet.unmount();

    const loud = await render(
      createElement(
        MapleProvider,
        { options: { branch: BRANCH, fetch: fetching } },
        createElement(StateProbe),
      ),
    );
    await expect.element(loud.getByTestId("state")).toHaveTextContent("all");
    await expect.poll(() => calls).toBeGreaterThan(0);
  });
});
