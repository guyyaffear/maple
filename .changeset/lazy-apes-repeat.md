---
"@maple-kit/core": minor
---

`githubStore` finds the pull request, instead of being told the branch.

The branch name is the easy case and not the common one. A preview hostname has
to be a DNS label, so what it carries is usually a ticket or a shortened
branch — and the branch is then the one thing the browser does not know, while
the build knows its commit for certain. Every integration that hit this wrote
the same two GitHub calls and the same cache outside Maple, which is the shape
of a missing option.

`GitHubStoreOptions.pull` is that option, tried in order:

1. `pull.commit` — `GET /commits/{sha}/pulls`, which names the pull request
   outright rather than inferring it.
2. The identifier as the head branch's own name, the plain case.
3. `pull.matches(head, identifier)` — asked per open pull request, newest
   first, so an application supplies its own rule and not a GitHub client.

`GitHubStoreOptions.cache` takes a `createPullCache()`. It is a parameter
rather than a closure because a per-reviewer credential means a store built
**per request**, so a cache inside one would be thrown away with it — which is
why `list` and `append` each paid a lookup on every call. Only a hit is kept: a
branch is pushed, the preview builds, and the pull request is opened after
that, so a miss has to be re-asked.
