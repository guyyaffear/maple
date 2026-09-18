/**
 * The msw server this package's suites start from.
 *
 * Re-exported from core for the same reason as the fake beside it: one
 * harness, one rule about unhandled requests, and no second place for that
 * rule to be relaxed.
 */

export { createTestServer, useTestServer } from "../../../core/test/msw/server.js";
