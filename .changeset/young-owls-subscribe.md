---
"@maple-kit/core": minor
---

Add `@maple-kit/core/client`, the reviewer interface's state machine.

`createMapleClient({ branch })` is a plain object with `subscribe` and
imperative methods: the comment list and its five filters, the composer, the
pick, a draft's whole life, the navigation guard and theme detection. No React
and no DOM until `start()`, so a binding for React, Svelte or Astro is a
subscription over it rather than a second implementation of it.

A draft is written 400ms behind the keystroke, keyed by branch and anchor,
expired after a week, cleared by a send and never by a close, and reconciled
across tabs so one tab cannot hand back a comment another already posted.
`beforeunload` exists only while a draft is dirty, because leaving it attached
costs the host application its bfcache.

The overlay's scheme is the opposite of the host's; the scheme a comment
records is the host's. Those are two facts, and this is where they stay apart.
