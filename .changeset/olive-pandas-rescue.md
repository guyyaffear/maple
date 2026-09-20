---
"@maple-kit/core": patch
---

Correct the comment App's permissions: `Issues` is not one of them.

`docs/github-auth.md` asked for `Issues: Read and write` on the reasoning that a
pull-request conversation comment is an issue comment, which is true, and that
the write therefore needs the `Issues` permission, which is not.

GitHub lists all four endpoints `githubStore` uses — list, create, read and
update a comment — under both `Issues` and `Pull requests`, and Maple only ever
comments on a pull request. So `Pull requests: Read and write` plus `Metadata`
is the entire set, and an App carrying `Issues` hands every reviewer's token
write access to every issue in the repository for no benefit.
