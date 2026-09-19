---
"@maple-kit/core": minor
---

Let the route choose a store per request, so a credential can be per reviewer.

`RouteOptions.store` took one connector, built once, holding one token. That is
the right shape for a store the deployment owns and the wrong one for a store
the reviewer owns: with a GitHub token per person, the connector that holds it
differs per request.

It now also takes a resolver — `(request: IdentityRequest) => StoreConnector |
null`, sync or async — called on every request that needs a store. Returning
null means this reviewer has nowhere to write yet, and the route answers 401
rather than writing the comment as somebody else.

`/me` never resolves a store, because asking who someone is must work before
they have linked anything. A wrong method is answered before the resolver is
asked, since that is not a credential problem.

**Not breaking:** passing a connector still works and is unchanged.
