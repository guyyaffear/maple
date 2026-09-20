/**
 * A gate connector that keeps its verdicts in a Map.
 *
 * It exists so the contract suite and the examples can drive the whole gate
 * path without a forge. Nothing here survives a restart, and nothing it
 * publishes blocks anything.
 */

import type { GateConnector, GateReport, GateTarget } from "../connectors/types.js";
import type { GateVerdict } from "../types.js";

/** Options for {@link memoryGate}. */
export interface MemoryGateOptions {
  /** Connector name reported to Maple. Defaults to `"memory"`. */
  readonly name?: string;
}

/** A gate connector plus the history a test asserts on. */
export interface MemoryGate extends GateConnector {
  /** Every verdict published for a commit, oldest first. */
  history(target: GateTarget): readonly GateVerdict[];
  /** Forgets everything, so one test cannot see another's. */
  reset(): void;
}

/** Creates an in-memory gate connector. */
export function memoryGate(options: MemoryGateOptions = {}): MemoryGate {
  const published = new Map<string, GateVerdict[]>();

  return {
    name: options.name ?? "memory",
    publish(report: GateReport): Promise<void> {
      const at = keyOf(report);
      published.set(at, [...(published.get(at) ?? []), report.verdict]);
      return Promise.resolve();
    },
    read(target: GateTarget): Promise<GateVerdict | undefined> {
      return Promise.resolve(published.get(keyOf(target))?.at(-1));
    },
    history(target: GateTarget): readonly GateVerdict[] {
      return published.get(keyOf(target)) ?? [];
    },
    reset(): void {
      published.clear();
    },
  };
}

/** One surface is one branch at one commit; a new push is a new decision. */
function keyOf(target: GateTarget): string {
  return `${target.branch}@${target.sha}`;
}
