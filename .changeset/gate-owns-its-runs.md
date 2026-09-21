---
"@maple-kit/core": minor
---

`githubGate` no longer tries to update a check run another GitHub App created.

The action publishes at push time as GitHub Actions and the route publishes at
resolve time as Maple's own App. A check run may only be modified by the App
that made it, so the second publisher was answered with
`403 Invalid app_id … check run can only be modified by the GitHub App that
created it` — and because a gate publish must never fail a resolve, that failure
was caught, logged and invisible. The check simply never moved.

`GitHubGateOptions.appId` names this App. Given it, the gate considers only its
own runs and posts a new one to supersede anyone else's, leaving theirs
untouched. Without it the behaviour is unchanged, which is correct when a single
publisher owns the check.

Found by driving the loop by hand against a live repository, not by a test:
every test until now had exactly one publisher.
