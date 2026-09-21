---
"@maple-kit/core": minor
---

The SDK route publishes the merge gate, so resolving the last comment clears
`maple/visual-review` on the same commit with no new push.

- **`RouteOptions.gate`** takes a `GateConnector` or a `GateResolver`, chosen
  per request the way `store` and `media` already are. The logic is in
  `src/route/gate.ts`, not in `handler.ts`.
- **`StoreConnector.head(branch)`** is a new optional method: the commit a
  surface points at now. A gate is about a commit and the route has only a
  branch, and the sha is resolved server-side rather than accepted from the
  browser, because the gate App holds `Checks: write`. `githubStore` implements
  it; `memoryStore` implements it when given `heads`.
- A gate publish that fails **costs the check update and nothing else**. The
  status change has already happened, the route still answers 200, and the
  failure goes to the logger.

**What broke:** `capabilitiesOf("store", …)` and `maple connectors --json` now
report a `head` key. Anything asserting on the exact shape of either needs the
extra field. No connector has to change: `head` is optional, and a store
without it publishes no gate rather than failing.
