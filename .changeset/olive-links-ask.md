---
"@maple-kit/core": minor
---

Ask once before a client-side navigation takes an unsent comment away.

The design document's third layer is "while dirty, prevent the default and ask
once", and the confirm copy it specifies — "You have an unsent comment on the
Yield card", Keep writing / Discard — has nowhere else to appear, because no
current browser lets `beforeunload` carry custom text.

`createMapleClient({ askToLeave })` supplies the ask. A capture-phase click on a
same-origin anchor now prevents the default while a draft is dirty, saves, and
hands the surface a question: the reason, the draft's id, the name `labelFor`
resolves for what it sits on, and where the click was going. The answer may
arrive later, so a rendered dialog is as usable as a native one. Discard throws
the draft away and performs the navigation that was prevented; Keep writing does
nothing at all, which is what leaves the composer the focus it had.

Once per draft, literally: a reviewer who kept writing and then deliberately
clicks another link is not asking to be interrogated again. Without
`askToLeave` nothing changes — the guard saves and lets the click through — so
the headless layer stays usable by a caller that has no interface. The other
three layers are untouched: `beforeunload` still never asks, `pushState` and
`popstate` still only save.
