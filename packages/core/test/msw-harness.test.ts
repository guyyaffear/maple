import { http, HttpResponse } from "msw";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { createTestServer, useTestServer } from "./msw/server.js";

/**
 * The harness itself, not a connector. If this fails, every network test built
 * on it is unreliable, so the guarantees are asserted once and directly.
 */
describe("the msw test server", () => {
  const server = createTestServer(
    http.get("https://api.example.com/comments", () =>
      HttpResponse.json({ comments: [{ id: "c_1" }] }),
    ),
  );

  useTestServer(server, { beforeAll, afterEach, afterAll });

  it("answers a request a handler declared", async () => {
    const response = await fetch("https://api.example.com/comments");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ comments: [{ id: "c_1" }] });
  });

  it("fails a request nobody mocked instead of letting it out", async () => {
    await expect(fetch("https://api.example.com/not-mocked")).rejects.toThrow();
  });

  it("serves an error shape when a handler declares one", async () => {
    server.use(
      http.get("https://api.example.com/comments", () =>
        HttpResponse.json({ message: "rate limited" }, { status: 429 }),
      ),
    );

    const response = await fetch("https://api.example.com/comments");

    expect(response.status).toBe(429);
  });

  it("resets an override between tests", async () => {
    const response = await fetch("https://api.example.com/comments");

    expect(response.status).toBe(200);
  });
});
