# Network mocks

Every network call Maple makes is mocked here with [msw](https://mswjs.io), and
the same handlers are reused by Storybook so a story and a test never disagree
about what an API returns.

## Layout

One file per upstream, named after it:

```
msw/
  github.ts       handlers for the GitHub REST and GraphQL calls
  handlers.ts     the array every test server starts from
  server.ts       setupServer() for Node tests
```

## Conventions

- A handler returns the shape the real API returns, including its error shapes.
  A test that only ever sees a 200 is not testing the code that handles a 500.
- Unhandled requests fail the test (`onUnhandledRequest: "error"`). A request
  nobody mocked is a request nobody noticed.
- Fixtures are trimmed real responses with identifiers replaced, never
  hand-written objects that drift from the API.

## Status

The harness is in place and `msw-harness.test.ts` asserts its two guarantees: a
declared handler answers, and an unmocked request fails the test. `handlers.ts`
is empty because Maple makes no network calls yet; the first connector adds its
upstream there.
