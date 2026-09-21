---
"@maple-kit/core": minor
---

`POST /api/maple/assist`: a comment judged as it is typed

A new route arm and the client loop over it. The endpoint lives in
`src/route/assist.ts` rather than in the dispatcher, because it owns state a
dispatcher has no business holding: a cache, so a pause and a retype cost one
call, and a per-session limiter, so a stuck client cannot spend a model budget.
`RouteOptions.assist` switches the whole tier on; without it `/assist` answers
404 and nothing about the composer changes.

On the client, `ComposerState.assist` carries the judgement and
`ClientState.assist` carries what this deployment can judge, read off `/me` so a
card has its pillars before it has any scores. The loop debounces over the value
the composer already debounces into drafts, aborts the request in flight on the
next keystroke, and **swallows a failure**: the field keeps working and the
score just does not arrive.

`maple-assist=off` joins the precedence chain the interface already has — query
string, then the viewer's stored preference, then props, then the default — and
`MapleClient.setAssist` is the viewer's own switch.

**Breaking:** `ComposerState` gains a required `assist`, and `MapleConfig` gains
a required `assist`. Anything constructing either literal has to add the field;
`ASSIST_IDLE` is exported for the first.
