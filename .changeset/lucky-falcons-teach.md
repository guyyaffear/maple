---
"@maple-kit/core": patch
---

Say plainly why Maple needs two GitHub Apps rather than one.

`docs/github-auth.md` explained the consequence and buried the reason. It now
leads with the mechanism — a user-to-server token is bounded by the App's
permissions, so every permission the App carries is one every reviewer's token
carries — and states the blast radius: one App for both jobs turns a phished
reviewer from "comments they could write anyway" into a read of every repository
the App is installed on, silently.

Also says the thing that was only implied: a comment App must not carry the
gate's permissions before the gate exists, because that is all of the exposure
and none of the benefit.
