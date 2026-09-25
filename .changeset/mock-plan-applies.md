---
"@maple-kit/mock": minor
"@maple-kit/ui": minor
---

The mock box puts the planner's reading straight into the draft instead of
offering it as a chip. Each new reading is applied over what the draft held
before the sentence, and emptying the field, or a sentence that names no
state, puts that back; a change by hand keeps what is there. While a plan is on
its way a sweep runs along the field's lower edge instead of a skeleton chip.

Breaking: `MockClient.suggest` is gone, since nothing is left to take. The
reading is still on `MockClientState.suggestions`.
