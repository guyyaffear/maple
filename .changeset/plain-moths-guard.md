---
"@maple-kit/core": minor
---

`githubGate`: the check run that holds a merge open.

`maple/visual-review`, published from a `GateVerdict`. Blocked is
`status: in_progress` with no conclusion, never `conclusion: failure` — a
required check passes only on `success`, `skipped` or `neutral`, so an open run
blocks exactly as hard as a failure and, unlike a failure, can be exited with
no new commit.

A second publish updates the run in flight. Where the existing run is already
completed, a new one is posted under the same name and SHA instead of the
completed one being reopened.

`read` gives back the whole verdict, because the counts ride in `external_id`
rather than in the markdown summary a person reads. A run some other tool
created under the same name reads back as `unreadable` with zero counts, which
is the honest answer.

`CHECK_NAME` is exported: it is the string a branch-protection ruleset
requires, and changing it silently orphans the required check.
