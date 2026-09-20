---
"@maple-kit/core": minor
---

A merge gate has a shape: `decideGate`, and a fifth connector kind.

`@maple-kit/core/gate` decides whether a commit is clear to merge from the
comments alone, and `GateConnector` publishes that decision to a forge. They
are apart on purpose: `maple/visual-review` is a GitHub check run, GitLab uses
external status checks and Bitbucket's enforcement is Premium-only, so one
decision has three publications. The split keeps the check-run API out of core.

A `GateVerdict` carries a **reason**, not only a conclusion, because the two
neutrals need different answers from a person: a store that could not be read
is not a store that cannot record status.

Everything but `resolved` blocks — including `orphaned`, so that a layout change
that unpins a comment cannot silently clear the gate. `blockOn` narrows it.

`runGateContract` and `memoryGate` are in `@maple-kit/core/testing`. The
contract asserts the property that sank Chromatic: a gate that blocks must be
able to stop blocking, on the same commit, with no new push.

`ConnectorKind` gains `"gate"`, so `maple connectors` prints it. `docs/gate.md`
is the design, including what the GitHub gate will have to do.
