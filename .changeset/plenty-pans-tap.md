---
"@maple-kit/core": minor
"@maple-kit/ui": minor
---

`withMaple` for Next, and a page that says when the tagger did not run.

Tagging a Next build takes two settings that have to agree: a Turbopack rule
that adds `data-maple-src` and `data-maple-name`, and `reactRemoveProperties`,
which must not take them off again on the same build. Wired by hand they
disagree **silently** — nothing throws, the page renders, and every comment
anchors to "this page" with no component name and no file.

Both ways it goes wrong have now happened in a real integration:

1. `reactRemoveProperties` left on for the preview build, so the rule tags and
   the pass immediately untags.
2. `"src/**/*.tsx"` as the rule key. Turbopack matches a key containing a
   separator against the whole path, so it never matches — and a rule that
   matches nothing is not an error.

`@maple-kit/core/next` exports `withMaple(config, { preview })`: one flag drives
the rule, the stripping and a webpack hook, so `next dev --webpack` is not a
quiet downgrade either. It throws when the config already sets
`compiler.reactRemoveProperties`, because two owners for the field that decides
whether the tagger's work survives is the bug it exists to prevent; extra
patterns go through `removeProperties`.

A build still cannot report this — from the build's side nothing happened — so
the page is asked instead. `pageIsTagged` in `@maple-kit/core/overlay` looks for
one `data-maple-src`; the controller asks on start and on every pick and keeps
the answer as `ClientState.tagged`, logging a warning the first time it turns
false. The island's settings panel carries a row saying so and naming
`withMaple`, because that panel is where someone wondering why everything says
"this page" will already be looking.
