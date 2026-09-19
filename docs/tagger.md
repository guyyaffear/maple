# The JSX tagger

**Status:** implemented. The transform is `@maple-kit/core/tagger`, the Vite
plugin is `@maple-kit/core/vite`, the Next loader is `@maple-kit/core/loader`,
and `examples/vite-app` and `examples/next-app` assert on their own build output.

## The problem

A comment is only as useful as the anchor under it. "The spacing here is wrong"
needs to become "`src/components/DashboardHeader.tsx:42`", or the agent starts
by searching instead of fixing.

React used to make this easy. `_debugSource` carried the JSX file and line into
the fiber tree, and a devtool could read it straight off the DOM node. React 19
removed it, and `captureOwnerStack` returns `null` outside development. Every
tool that reads component source from the tree today — react-grab among them —
is a development-only tool for exactly this reason.

Previews are production builds. So there is nothing to read.

## The decision

Maple emits the source location at build time, into the DOM, on preview builds
only:

```html
<h1 data-maple-src="src/components/DashboardHeader.tsx:42:7" data-maple-name="DashboardHeader"></h1>
```

- `data-maple-src` — `path:line:column`, repository-relative and POSIX-separated
  so it is identical on every machine.
- `data-maple-name` — the component's display name, which survives minification
  and is what a reviewer actually recognises.

Production builds strip both. The attributes exist in preview and nowhere else.

## Why this is the highest-leverage decision in the plan

It is not only about file paths. Without it, anchoring falls back to CSS
selectors, and modern styling defeats selector generation: Tailwind utility
classes are not identifying, and CSS-module class names are content hashes that
change on every build. What is left is `nth-child` paths, which break when a
list reorders.

`data-maple-name` gives the anchor cascade a durable rung above the selector,
and `data-maple-src` gives the agent somewhere to start. One build flag fixes
both.

## Emitting

**One implementation, two ways of reaching it.** The transform is a Babel plugin
in `@maple-kit/core/tagger`. Both emitters run that same plugin, so they cannot
drift into different behaviour — which matters, because a tagged element in one
framework and an untagged one in another is a bug nobody notices until an anchor
orphans.

```ts
import { mapleTagger } from "@maple-kit/core/tagger";
```

### Why not an SWC plugin

The design first called for `@maple-kit/swc-plugin-tagger` on the Next side. An
SWC plugin is a Rust crate compiled to WebAssembly. That is a second toolchain,
a second release process and a binary artefact in an npm package, to duplicate a
transform that already exists — against a rule that says TypeScript everywhere
unless there is a clear cross-language winner. There is not one here: the tagger
runs on preview builds only, where a few hundred milliseconds do not matter.

Next reaches the same plugin through a **loader**, which `next.config.ts`
configures for both webpack and Turbopack. SWC still does the stripping, because
stripping is the part that must be right in production.

### Next

```ts
import { withMaple } from "@maple-kit/core/next";

export default withMaple(config, { preview: process.env["MAPLE_PREVIEW"] === "1" });
```

One flag, because tagging a Next build takes **two** settings that have to
agree — a Turbopack rule that adds the attributes, and a dead-attribute pass
that must not remove them on the same build — and wired by hand they disagree
silently. Nothing throws, the page renders, and every comment anchors to "this
page" with no component name and no file. `withMaple` owns both, and a webpack
hook as well, so `next dev --webpack` is not a quiet downgrade.

It **throws** when the config already sets `compiler.reactRemoveProperties`.
Two owners for the field that decides whether the tagger's work survives is the
bug it exists to prevent; extra patterns go through `removeProperties`.

#### The two ways it goes wrong by hand

Both have happened in a real integration, and neither produces an error.

1. **`reactRemoveProperties` left on for the preview build.** The rule tags and
   the pass immediately untags, so the build does the work twice and ships
   nothing. It has to be `false` on exactly the builds the tagger runs on.
2. **A path glob as the rule key.** `"src/**/*.tsx"` never matches: Turbopack
   matches a key containing a separator against the whole path. The key is a
   **filename** glob, `"*.tsx"`, and a key that does not match is not an error —
   it is a rule that does nothing.

And a third that does produce an error, eventually: **do not add `as: "*.tsx"`
to that rule.** It reads as the right thing to write — the loader does return
TSX — but Turbopack's `*` captures the whole filename including its extension,
so the module is renamed `page.tsx.tsx` and every relative import in the project
fails to resolve. Omitting `as` keeps the original type.

#### When it did not run

A build cannot report this, because from the build's side nothing happened. The
page can: the controller asks it, on start and on every pick, whether anything
carries `data-maple-src` (`pageIsTagged` in `@maple-kit/core/overlay`).
`ClientState.tagged` is the answer, the logger gets a warning the first time it
turns false, and the island's settings panel says so in a row naming
`withMaple`. It is the only signal there is, so it is worth the `querySelector`.

### Vite

A transform inside the Maple plugin, so there is nothing extra to configure:

```ts
import { maple } from "@maple-kit/core/vite";

export default defineConfig({ plugins: [maple({ tagger: mode !== "production" })] });
```

## What it emits

Intrinsic elements only — `<h1>`, `<div>`, `<li>`. A composite element's props
belong to the component that defines them, and writing an attribute a component
never spreads onto the DOM changes nothing except the risk of changing
something.

`data-maple-name` is the nearest enclosing declaration whose name starts with a
capital: a function declaration, a class, or an arrow assigned to a `const`,
including through a `memo(…)` or `forwardRef(…)` wrapper. When nothing matches,
the attribute is omitted. It is a syntactic guess, and a wrong name a reviewer
does not recognise is worse than no name at all.

Columns are 1-based, the way an editor addresses them. Babel counts them from
zero, so the tagger adds one.

## `data-maple-label`, which the tagger does not emit

A reviewer's surface says "the Yield card", not "YieldCard". That name comes
from `data-maple-label`, which an **application** writes by hand, on the element
or on any ancestor of it, so one attribute on a card names everything inside it:

```html
<article data-maple-label="the Yield card">…</article>
```

`labelFor` in `@maple-kit/core/anchor` reads it: the nearest `data-maple-label`
at or above the element, then the component name — from the anchor, or from
`data-maple-name` on the page — with its camel case unpicked into a noun phrase.
`YieldCard` becomes "Yield card" and `APIKeyCard` becomes "API key card", since
an acronym is left as it was written and every other word after the first is
lower-cased. When nothing names the element, the surface says nothing rather
than inventing a name.

**The tagger never writes this attribute**, although it knows the component
name. Writing it would only restate the fallback, on every intrinsic element in
the file — and that is the harm: a `data-maple-label` on an inner `<span>` ends
the upward walk, so a label the application wrote on the card above it would
never be found. A label is a sentence about a region, and the tagger has no
source for one that the reader cannot derive itself.

## Stripping

Production correctness matters more than the feature. The attributes are removed
by the framework's own dead-attribute pass, not by a Maple step:

- **Next** — `compiler.reactRemoveProperties: { properties: ["^data-maple-"] }`,
  which is what `withMaple` sets on every build that is not a preview.
- **Vite** — the plugin does not run the transform outside preview mode, so
  there is nothing to strip.

Both are regex-based removals over the whole property name space, so a
`data-maple-key` or `data-maple-label` set by the application is removed too.
That is correct: both are hints for reviewers, and production has none.

## What the tagger must not do

- **Never tag in production.** The attributes name source paths. Leaking them is
  a disclosure, not a nuisance.
- **Never tag host components the application did not write.** Tagging a
  `node_modules` component gives the agent a path it must not edit.
- **Never change runtime behaviour.** Attributes only; no wrappers, no extra
  elements, no changed prop identity. A React tree that renders differently
  under the tagger is a tagger bug.
- **Never assume the tagger ran.** Every consumer treats `data-maple-src` as
  optional and falls through the anchor cascade when it is absent.
- **Never tag twice.** An element that already carries `data-maple-src` is left
  alone, so a file passing through two transforms comes out the same.

## Verification

Both questions this design opened are now answered by a build rather than by
reading.

**`reactRemoveProperties` does run over the server bundle.** This was the
failure to worry about: a stripped client with an unstripped server looks
exactly like success, because the thing people check is the browser. It is
checked in `examples/next-app/scripts/verify.ts`, which runs three builds:

| Build       | Tagger | Strip | Asserts                                              |
| ----------- | ------ | ----- | ---------------------------------------------------- |
| preview     | on     | off   | `data-maple-` present in `static/` **and** `server/` |
| strip check | on     | on    | `data-maple-` absent from both                       |
| production  | off    | on    | `data-maple-` absent from both                       |

The middle one is the one that matters. A production build never runs the
tagger, so finding it clean proves only that nothing happened; tagging and
stripping in the same build is what exercises the stripping pass.

**The `jsxImportSource` shortcut is moot.** It was only ever attractive as a way
to avoid writing a transform. Maple writes one, so there is nothing to gate on
`NODE_ENV`.

## Open

- Vue, Svelte and Solid each have a development-only equivalent. The same
  "keep it on in preview" flip should apply, but the emitters are separate work.
