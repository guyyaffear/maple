import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  MapleContextError,
  MapleProvider,
  MapleProviderError,
  useAnchor,
  useComments,
  useComposer,
  useDraft,
  useMaple,
  usePicker,
} from "../src/index.js";

import type { ReactElement } from "react";

const BRANCH = "feat/x";

/**
 * Every hook at once, so a server render that crashes crashes here rather than
 * in an application. It renders the numbers a server can honestly know.
 */
function Probe(): ReactElement {
  const state = useMaple();
  const comments = useComments("open");
  const composer = useComposer();
  const picker = usePicker();
  const draft = useDraft();
  const anchor = useAnchor("c_1");

  return createElement(
    "span",
    null,
    `${state.phase}/${String(comments.length)}/${String(composer.open)}/` +
      `${String(picker.armed)}/${String(draft === undefined)}/${String(anchor === undefined)}`,
  );
}

function server(): string {
  return renderToString(
    createElement(MapleProvider, { options: { branch: BRANCH } }, createElement(Probe)),
  );
}

/**
 * The server snapshot is the controller's idle state: it reaches the DOM,
 * storage and the route only from effects, so there is no second shape.
 */
describe("rendering on a server", () => {
  it("renders every hook without a document, a storage or a route", () => {
    expect(server()).toContain("idle/0/false/false/true/true");
  });

  it("makes no request while rendering", () => {
    let calls = 0;
    const fetching = (): Promise<Response> => {
      calls += 1;
      return Promise.resolve(Response.json({ comments: [] }));
    };

    renderToString(
      createElement(
        MapleProvider,
        { options: { branch: BRANCH, fetch: fetching } },
        createElement(Probe),
      ),
    );
    expect(calls).toBe(0);
  });

  it("hydrates from the same value, because the snapshot is one read", () => {
    expect(server()).toBe(server());
  });
});

describe("a provider that cannot provide", () => {
  it("names the hook that was called outside one", () => {
    expect(() => renderToString(createElement(Probe))).toThrow(MapleContextError);
    expect(() => renderToString(createElement(Probe))).toThrow(/useMaple\(\)/);
  });

  it("says what a provider needs when it was given neither a client nor options", () => {
    expect(() => renderToString(createElement(MapleProvider, null, createElement(Probe)))).toThrow(
      MapleProviderError,
    );
  });
});
