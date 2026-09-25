---
"@maple-kit/mock": minor
"@maple-kit/ui": minor
---

The mock box's "Shown as" and "Flags" rows start on what the page really sees:
the reviewer's role and permissions, read from the identity call's last real
answer, and each flag's evaluated value. The real option carries a green dot,
and choosing it again drops the override. `MockClientState.realAs` (a new
`RealAs` type) holds the real role and permissions.
