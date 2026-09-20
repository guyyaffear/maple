import { describe, expect, it } from "vitest";

import { decideGate } from "../src/gate/decide.js";
import { storedComment } from "../src/testing/fixtures.js";
import { memoryGate } from "../src/testing/memory-gate.js";

const at = { branch: "feature/x", sha: "abc123" };
const blocked = decideGate([storedComment({ status: "open" })]);
const clear = decideGate([storedComment({ status: "resolved" })]);

describe("the in-memory gate", () => {
  it("keeps every verdict a commit was given, oldest first", async () => {
    const gate = memoryGate();
    await gate.publish({ ...at, verdict: blocked });
    await gate.publish({ ...at, verdict: clear });

    expect(gate.history(at).map((verdict) => verdict.conclusion)).toEqual(["blocked", "clear"]);
  });

  it("forgets everything on reset, so one test cannot see another's", async () => {
    const gate = memoryGate();
    await gate.publish({ ...at, verdict: blocked });
    gate.reset();

    expect(gate.history(at)).toEqual([]);
    expect(await gate.read!(at)).toBeUndefined();
  });

  it("reports the name it was given", () => {
    expect(memoryGate({ name: "fake" }).name).toBe("fake");
  });
});
