import { afterAll, afterEach, beforeAll } from "vitest";

import { githubGate } from "../src/connectors/github-gate.js";
import { runGateContract } from "../src/testing/gate-contract.js";
import { createChecksFake } from "./msw/github-checks.js";
import { createTestServer, useTestServer } from "./msw/server.js";

const checks = createChecksFake();
const server = createTestServer(...checks.handlers);

useTestServer(server, { beforeAll, afterEach, afterAll });
afterEach(() => checks.reset());

runGateContract({
  name: "github",
  create: () =>
    Promise.resolve({
      connector: githubGate({ owner: "maple-kit", repo: "app", token: "gate-token" }),
    }),
});
