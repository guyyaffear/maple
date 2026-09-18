import { http, HttpResponse } from "msw";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { createTransport, MapleRequestError } from "../src/client/index.js";
import { storedComment } from "../src/testing/fixtures.js";
import { createMapleFake, MAPLE_BASE, mapleUnavailable } from "./msw/maple.js";
import { createTestServer, useTestServer } from "./msw/server.js";

const fake = createMapleFake({ pageSize: 2 });
const server = createTestServer(...fake.handlers);

useTestServer(server, { beforeAll, afterEach, afterAll });

function transport(branch = "feat/x") {
  return createTransport({ branch, basePath: MAPLE_BASE });
}

describe("listing a branch", () => {
  it("follows the store's cursor to the end rather than showing one page", async () => {
    fake.seed(
      storedComment({ id: "c_1" }),
      storedComment({ id: "c_2" }),
      storedComment({ id: "c_3" }),
    );

    await expect(transport().list()).resolves.toHaveLength(3);
  });

  it("asks for the branch it was opened on", async () => {
    let asked: string | null = null;
    server.use(
      http.get(`${MAPLE_BASE}/comments`, ({ request }) => {
        asked = new URL(request.url).searchParams.get("branch");
        return HttpResponse.json({ comments: [] });
      }),
    );

    await transport("release/2026-09").list();
    expect(asked).toBe("release/2026-09");
  });
});

describe("writing", () => {
  it("posts a comment without claiming an author, and reads back the stored one", async () => {
    const comment = await transport().append({
      branch: "feat/x",
      body: "The spacing is off.",
      anchor: { component: "YieldCard" },
      createdAt: "2026-09-18T10:00:00.000Z",
    });

    expect(comment.author.provenance).toBe("server");
    expect(comment.status).toBe("open");
  });

  it("sends JSON, so the route can read the body at all", async () => {
    let type: string | null = null;
    server.use(
      http.post(`${MAPLE_BASE}/comments`, ({ request }) => {
        type = request.headers.get("content-type");
        return HttpResponse.json(storedComment(), { status: 201 });
      }),
    );

    await transport().append({
      branch: "feat/x",
      body: "b",
      anchor: {},
      createdAt: "2026-09-18T10:00:00.000Z",
    });
    expect(type).toBe("application/json");
  });

  it("patches a status and hands back what the store kept", async () => {
    const comment = await transport().append({
      branch: "feat/x",
      body: "b",
      anchor: {},
      createdAt: "2026-09-18T10:00:00.000Z",
    });

    await expect(transport().setStatus(comment.id, "resolved")).resolves.toMatchObject({
      status: "resolved",
    });
  });
});

describe("who the reviewer is", () => {
  it("returns the user the host application's session named", async () => {
    await expect(transport().me()).resolves.toMatchObject({ id: "u_7" });
  });

  it("returns null when there is no session, which is the guest flow", async () => {
    server.use(http.get(`${MAPLE_BASE}/me`, () => HttpResponse.json({ user: null })));

    await expect(transport().me()).resolves.toBeNull();
  });
});

describe("when the route fails", () => {
  it("throws a plain Error subclass carrying the status and the route's words", async () => {
    server.use(mapleUnavailable());

    const failure = await transport()
      .list()
      .catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(MapleRequestError);
    expect(failure).toBeInstanceOf(Error);
    expect((failure as MapleRequestError).status).toBe(500);
    expect((failure as MapleRequestError).message).toBe("Something went wrong");
  });

  it("says something rather than nothing when the body is not JSON", async () => {
    server.use(
      http.get(
        `${MAPLE_BASE}/comments`,
        () => new HttpResponse("<html>502</html>", { status: 502 }),
      ),
    );

    await expect(transport().list()).rejects.toThrow("The Maple route did not answer.");
  });
});
