---
"@maple-kit/core": minor
"@maple-kit/react": minor
"@maple-kit/ui": minor
---

Let a reviewer link their GitHub account from the overlay.

`ClientState.github` carries the link, and it has four states rather than a
boolean. `unsupported` is a route that serves no sign-in at all, which is a
deployment storing comments some other way — not a reviewer who has not linked.
A surface draws nothing for the first and an offer for the second, so the two
must not collapse.

`MapleClient` gains `linkGitHub()` and `unlinkGitHub()`. The first resolves as
soon as there is a code to show and keeps polling after it; watch `github` for
the rest. The wait is here rather than in a held-open request, because a person
takes minutes to read a code, reach github.com and type it.

`@maple-kit/react` gains `useGitHubLink()`. `@maple-kit/ui` gains
`Maple.Account`, the row the settings panel now opens with: the offer, the code
and where to type it, or the account and a way to forget it here. It says
plainly that forgetting the token is not revoking the authorisation, because a
reviewer who thinks it is will not revoke.

**Breaking:** `Transport.me()` returns `{ user, github? }` rather than the user
alone, so the link state travels with the identity it belongs to.

The island's bundle budget goes from 21 KB to 22 KB gzipped. It was at 21.0 with
this row in it, which is not a number to leave a build standing on.
