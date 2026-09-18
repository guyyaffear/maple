---
"@maple-kit/core": patch
"@maple-kit/react": patch
"@maple-kit/ui": patch
"@maple-kit/mcp": patch
"@maple-kit/cli": patch
---

Ship the docs in the type declarations and not in the JavaScript.

Prose was about 46% of `@maple-kit/ui`'s gzipped weight, which is weight every
application downloads to read something no runtime looks at. Every package's
build now drops JSDoc from the emitted JavaScript and keeps it in the `.d.ts`,
which is what an editor reads anyway.

Two kinds of comment are kept deliberately. `@__PURE__` and
`@__NO_SIDE_EFFECTS__` stay, because dropping them would silently cost
tree-shaking. Legal notices stay, and the two ported files in
`packages/core/src/lib/` are now marked `@preserve` so their BSD-2-Clause and
MIT attributions reach the published build, which those licences require.
