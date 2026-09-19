---
"@maple-kit/core": minor
"@maple-kit/ui": minor
---

Say out loud when a request did not work, instead of drawing nothing.

Every failure the overlay could hit was silent. A 401 on the list rendered as
"Nothing here under this filter", which reads as a branch nobody has commented
on. A 401 on a send rendered as a button that did not move — and a reviewer
retries a button forever, where they read a sentence once and act on it. On a
preview whose store is built per reviewer, that is the **first** thing anyone
sees, and it said nothing at all.

**Breaking.** `ClientState.error` is a `MapleFailure`, not a string:

```ts
interface MapleFailure {
  kind: "offline" | "store" | "unauthorized" | "unknown";
  message: string; // already addressed to a reviewer
  during: "link" | "load" | "send" | "status";
  status?: number;
}
```

A string could not be branched on, so no surface could tell "sign in first"
from "the store is down" from "you are offline" — and those have three
different answers. `failureFrom` builds one; the route's own words go to the
logger instead of the page, because a connector's message can name a repository
or a rate limit.

`MapleClient` gains `clearError()`. `setStatus` no longer throws past the
binding into a click handler; it records the failure like the other three.

`load()` now asks `GET /me` **alongside** the list rather than after it. A 401
on the comments is usually a reviewer who has not signed in, and the sign-in is
the thing `/me` reports — so the one case that needed the offer was the one
case that never fetched it.

New in `@maple-kit/ui`, on its own subpath `@maple-kit/ui/notice`:
`Maple.Notice`, one band carrying the sentence and the single thing that would
fix it — **Sign in** under a 401 where a sign-in is on offer, **Try again**
under anything retryable, and no offer at all where the deployment serves no
sign-in, because pointing at a door that is not there is worse than silence.
The default composition mounts one in the island for `load`, `status` and
`link`, and one in the composer for `send`.

`Maple.List` no longer claims a branch is empty when it failed to read it.
