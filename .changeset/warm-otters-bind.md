---
"@maple-kit/react": minor
---

Add `@maple-kit/react`, the React binding over the reviewer controller.

`MapleProvider` puts one `@maple-kit/core/client` controller in scope and starts
it in an effect, so nothing reaches `document`, `localStorage` or the route
while React renders. `useMaple`, `useComments`, `useComposer`, `usePicker`,
`useAnchor`, `useDraft` and `useMapleClient` are each one `useSyncExternalStore`
over it and nothing more — the state machine stays in core, where a Svelte or
Astro binding can reach it without a rewrite.

Every derived read is cached against the state it came from, so a keystroke in
the composer does not re-render every mark on the page. `getServerSnapshot` is
that same read: an application that renders on the server gets the idle state
rather than a crash.

React is a peer dependency, 18 or 19. This package never depends on
`@maple-kit/ui`, so an application rendering comments in its own design system
pulls in none of the composed parts.
