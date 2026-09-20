---
"@maple-kit/core": minor
---

A screenshot on a pull request is a link a person can click.

`GitHubStoreOptions.media` takes a `MediaConnector`. Given one, `githubStore`
resolves a comment's first image attachment and passes it to `exportMarkdown`
as the `screenshots` map, so the table finally gets its **Shot** column. Given
none, behaviour is exactly what it was: the `MediaRef` sits in the fence and
nothing human-readable points at it.

The export already supported this; nothing called it. `exportMarkdown`'s
`hostedOnly` still drops anything that is not `http(s)`, so a development
connector serving data URLs produces no column rather than a dead one.

A media connector that rejects costs the table its link and nothing else. The
comment posts and the ref is kept: losing a reviewer's comment because a bucket
was down is the worse failure of the two.
