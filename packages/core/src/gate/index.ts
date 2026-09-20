/**
 * The merge gate: one verdict over a surface's comments, and the connector
 * kind that publishes it. `docs/gate.md` is the design.
 */

export { BLOCKING_STATUSES, decideGate } from "./decide.js";
export type { GateOptions } from "./decide.js";
