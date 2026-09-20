# Status

**US1 is there.** Every mechanism a comment passes through exists and is
tested, and so does the surface a reviewer touches: a comment can be picked,
written, anchored, exported, stored on a pull request, and read and resolved
by an agent, and a person can now do the first half of that with their hands.

The loop runs end to end. What is left is what stands between the loop and a
pull request enforcing it: identity through the route, and the gate.

## The path a comment takes, and what is built

| Step                            | Where                                   | State                                           |
| ------------------------------- | --------------------------------------- | ----------------------------------------------- |
| Element is tagged at build time | `core/tagger`, `core/vite`, `core/next` | ✅ both emitters, asserted by two example apps  |
| Reviewer picks a target         | `core/overlay`                          | ✅ element, region and text picking             |
| The pick becomes an anchor      | `core/anchor`                           | ✅ five rungs, four orphan reasons              |
| The page's shape is recorded    | `core/overlay`                          | ✅ badge, regions, breakpoint                   |
| A screenshot is attached        | `core/screenshot`, `core/route`         | ✅ paste, drop, file, capture, kept, read back  |
| The reviewer writes it          | `@maple-kit/ui`, `@maple-kit/react`     | ✅ marks, ring, island, composer, detail        |
| It is posted as them            | `core/auth`, `core/route`               | ✅ Device Flow, through the route, per reviewer |
| It is stored                    | `core/connectors/github`                | ✅ default store, contract-clean                |
| It reaches the pull request     | `core/export`                           | ✅ table over a visible fence, with a Shot link |
| An agent reads and resolves it  | `@maple-kit/mcp`                        | ✅ four tools, plus the Stop hook               |
| It holds the merge open         | `core/gate`, `core/connectors`          | ✅ `decideGate` and `maple/visual-review`       |

## What US1 added

### `@maple-kit/core`

Ten new entrypoints on top of Phase 0's four.

- **`/tagger`, `/vite`, `/loader`, `/next`** — the build-time JSX tagger and its
  two emitters. One Babel plugin behind both, so they cannot drift. Not an SWC
  plugin: that is a Rust crate compiled to WebAssembly, for a transform that
  already exists in TypeScript. `withMaple` owns both halves of the Next case,
  because wired by hand they disagree silently.
- **`/anchor`** — the cascade, `data-maple-key` → source → component → quote →
  selector, with four orphan reasons and no silent ancestor snap. A human name
  comes from `data-maple-label`, falling back to the component's own name with
  the camel case unpicked, so a reviewer reads "the Yield card". The fuzzy
  quote matcher is ported from Hypothesis; the approximate search under it is
  Sellers with Ukkonen's cutoff rather than a port of Myers' bit-parallel
  algorithm, because it can be checked against a brute-force reference, and 400
  seeded cases do that on every run.
- **`/overlay`** — the host (shadow root, adopted stylesheets only), the three
  pickers, the context badge and the per-branch draft store.
- **`/export`** — the human table over a visible ` ```maple ` fence, with a
  byte budget that sheds detail in a fixed order and never drops a comment.
- **`/route`** — one web-standard handler, plus a Node adapter. The author of a
  comment comes from the identity connector and never from the request body,
  and carries a stable colour slot derived from their id.
- **`/client`** — the framework-free reviewer controller: comments and filters,
  the composer, picking, drafts, the navigation guard, theme detection, the
  preference model behind the query string, and the GitHub link with its
  polling. No React anywhere in it.
- **`/auth`** — GitHub Device Flow, including `slow_down` back-off, and the
  reviewer's session: one user-to-server token per person in an `HttpOnly`
  cookie on the preview's own origin, so a preview holds no GitHub secret at
  all. `docs/github-auth.md` is the design and the threat model.
- **`/screenshot`** — paste and drop first, capture second.
- **`/connectors`** — `githubStore`, the default store, passing the shared
  contract.

A reviewer signs in from the preview itself. Device Flow runs through the
route — `POST`, `PATCH` and `DELETE` on `/auth/github` — so the exchange needs
no client secret and a preview environment holds none. Each reviewer's
user-to-server token lives in an `HttpOnly` cookie on the preview's own origin,
and `RouteOptions.store` takes a resolver so the connector holding it is built
per request. `docs/github-auth.md` is the design, the threat model and the
alternatives that were rejected.

A comment also keeps what came of it. `CommentResolution` records the commit an
agent believes addressed it, with its note and the time the write happened, so
`resolve_comment` no longer has to throw that away; a draft is comment-shaped,
carrying its anchor, its context and its attachments; and `parentId` is
reserved and documented in `docs/replies.md` as reserved, not built.

Two entrypoints answer for what goes wrong. `/client` carries a `MapleFailure`
rather than a message string, because "sign in", "the store is down" and "you
are offline" have three different answers and a string cannot be branched on;
`@maple-kit/ui/notice` is the band that says it and offers the one thing that
would fix it. Before them every failure the overlay could hit was silent, and a
401 on the list read as a branch nobody had commented on.

### `@maple-kit/react` and `@maple-kit/ui`

Two packages, not one. `@maple-kit/react` is headless and stops at hooks —
`MapleProvider` plus six `useSyncExternalStore` bindings over the controller,
and nothing deeper. `@maple-kit/ui` is the composed parts: the marks and the
ring, the island, the composer, the GitHub link row, and one default
composition over them. An
application rendering comments in its own design system depends on the first
and pulls in none of the second, which is also what keeps a later Svelte or
Astro binding a binding rather than a rewrite.

State reaches the stylesheet as `data-*` rather than as props, every part takes
`asChild`, and there is no visual variant anywhere: the sheet under 640px **is**
the composer panel. One shadow root, one adopted stylesheet built from a token
table, no hardcoded duration or easing, and `prefers-reduced-motion` handled by
redefining the tokens rather than switching rules off. Marks, the island and
the icons are 20.3 KB gzipped against a 21 KB budget, the stylesheet 11.8 KB
against 13 KB and the composer 8.2 KB against 9 KB, asserted by
`packages/ui/scripts/size.js` on every build.

Developer detail, the query string, dismissal and the island's corner are
presentation over all of it. Default detail is the default and nothing is
recorded differently in either, because the export fence carries every field
whichever one is on.

### `@maple-kit/mcp`

`maple-mcp` serves the four tools over stdio; `maple-stop-hook` keeps an agent
from finishing while comments are open, and gives up after eight attempts
rather than hanging a session. Verified against a real MCP handshake, not only
in unit tests.

### The examples

`examples/vite-app` and `examples/next-app` are real applications that assert
on their own build output, and they run in CI. Between them they answered the
question `docs/tagger.md` left open: **`reactRemoveProperties` does reach the
server bundle.** Proving it needed a third build that tags _and_ strips — a
production build never tags, so finding it clean proves only that nothing
happened.

### Numbers

**1,238 tests** — 836 in Node, 402 in real Chromium, up from 101. Forty-nine
changesets.
`lint typecheck format test test:browser build publint attw gitleaks lockfile
dco` all green, and `main` is protected by a ruleset requiring the eight CI
jobs, one approval and signed commits.

## What is deliberately absent

- **The Next codemod.** `app/api/maple/[...maple]/route.ts` is three lines a
  person can write today; the codemod that writes it is convenience, and the
  example does not have one checked in yet.
- **The CLI's comment commands.** `maple connectors` is all that exists.
  `list|inspect|reply|resolve|open` come with the TUI decision.
- **Replies.** Decided, not deferred: one body per comment. `parentId` is
  reserved and `docs/replies.md` says what revisiting it would cost.
- **A media connector that is not in-memory.** The route serves `POST /media`
  and `GET /media/{key}`, and `memoryMedia` in `@maple-kit/core/testing` shows
  the path end to end — but a deployment still has to bring a bucket. Where it
  brings none, the strip says so rather than offering a screenshot it would
  drop. `docs/screenshots.md` is the whole path.
- **Anything that calls the gate.** `decideGate` and `githubGate` are built and
  tested; no action, route or workflow invokes either, so nothing yet stops a
  pull request merging with comments still open.
- **Eval cases.** Still no AI path to score.

## What is now known that was not

Ten things cost time once and would cost it again. The first three are all one
failure — a build that does not tag — and none of them raises anything.

1. **`as: "*.tsx"` on a Turbopack rule renames the module.** Turbopack's `*`
   captures the filename including its extension, so `page.tsx` becomes
   `page.tsx.tsx` and every relative import stops resolving. Omit `as`.
2. **An app-router application with no `"use client"` produces a client bundle
   containing none of its own markup.** A client-side assertion about stripping
   passes against an empty string.
3. **snapdom's `toBlob` defaults to SVG**, and takes `type: "png"` rather than
   a MIME type. An SVG "screenshot" is a re-render of the page, which is the
   failure the paste path exists to hedge against.
4. **`localStorage` throws on _access_, not only on use**, in a private window
   and wherever site data is blocked. Reaching it has to be guarded too.
5. **A backtick inside a CSS template literal ends the literal.** The
   stylesheet modules are template strings, so a comment that quotes a class
   name in backticks terminates the sheet. It cost a build once.
6. **Rebuilding a surface to change one thing inside it reads as a flicker.**
   Re-rendering the island to toggle a filter re-ran its entrance and
   re-measured its height. The rows swap; the card stays.
7. **A Turbopack rule key containing a separator matches the whole path.**
   `"src/**/*.tsx"` therefore matches nothing, and a rule that matches nothing
   is not an error. The key is a filename glob. `withMaple` writes it.
8. **`reactRemoveProperties` left on for the preview build untags it again.**
   The rule adds the attributes and the pass takes them off, in one build, in
   silence. It is the other half `withMaple` exists to own.
9. **A `data:` URL cannot be redirected to.** A browser refuses to follow one,
   so a route that hands out a connector's URL has to serve that case rather
   than point at it.
10. **Node's request body is not text.** `setEncoding("utf8")` on the way in
    and `response.end(await result.text())` on the way out each round-trip a
    screenshot through a UTF-8 string, and it arrives as an image no decoder
    opens.

## What US2 has, and what it still needs

The gate's two halves are built. `decideGate` in `@maple-kit/core/gate` turns a
surface's comments into a `GateVerdict`, and `githubGate` publishes it as
`maple/visual-review` — held at `in_progress` while a comment is open, because
a required check passes only on `success`, `skipped` or `neutral`, so an open
run blocks as hard as a failure and can still be exited with no new push.
`GateConnector` is a fifth connector kind, with its own contract suite whose
central assertion is the property that sank Chromatic: a gate that blocks must
be able to stop blocking on the same commit. `docs/gate.md` is the design.

Nothing calls either of them yet. In dependency order:

1. **A second GitHub App for the gate.** The registered one carries `Checks`,
   `Contents` and `Merge queues` for a gate that did not exist, and a
   user-to-server token is bounded by the app's permissions — so today every
   reviewer's token can read the source of every installed repository. The
   comment app carries `Issues`, `Pull requests` and `Metadata` and nothing
   else; the gate authenticates as itself and never needs a user token.
   `docs/github-auth.md` has the reasoning.
2. **The action has to call them.** `maple-action` carries its own copy of the
   decision, written before core had one, and it cannot import
   `@maple-kit/core` because nothing is published to npm. Publishing core is
   the unblock; until then the two can drift, and the action's is the one CI
   would run.
3. **Reporting on every pull request** — forks, Dependabot and anything with no
   preview included — concluding `neutral`. A required check that skips some
   pull requests is a required check somebody deletes.
4. **`merge_group.checks_requested` passing immediately**, and `integration_id`
   pinned in the ruleset.
5. **Carrying resolutions across a new commit** by thread id, flipping a
   comment to `needs_reverify` where the diff touches the anchored route or
   component.
