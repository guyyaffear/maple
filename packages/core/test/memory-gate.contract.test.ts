import { runGateContract } from "../src/testing/gate-contract.js";
import { memoryGate } from "../src/testing/memory-gate.js";

runGateContract({ name: "memory", create: () => Promise.resolve({ connector: memoryGate() }) });
