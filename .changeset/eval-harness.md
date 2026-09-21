---
"@maple-kit/core": patch
---

The eval harness is plain vitest, and `better-sqlite3` is gone with evalite

evalite ran the first eval set and then aborted the process on exit: its result
store is `better-sqlite3`, whose statement finaliser calls
`RemoveEnvironmentCleanupHook` after the environment is gone, which on Node 24
is a native assertion failure and a non-zero exit. A harness that always exits
non-zero cannot enforce a threshold, which is what it was there for.

`evals/README.md` already said to port the scoring harness onto vitest if the
runner fought the code. Doing it removed the native build at install time —
`onlyBuiltDependencies` is empty again — and the `@fastify/static` override,
whose four advisories left with the dependency that carried them.

No published package changes. This is the repository's own tooling.
