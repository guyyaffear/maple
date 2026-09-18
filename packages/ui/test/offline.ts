/**
 * The route, answered without a network call.
 *
 * `MapleClientOptions.fetch` is the controller's own seam for this, so these
 * suites reach no origin at all rather than mocking one they never talk to.
 * What is under test here is the shadow root, the stylesheet and the scheme —
 * none of which depends on what the route says.
 */

/** Answers `/comments` with an empty branch and `/me` with no session. */
export function offlineFetch(): typeof globalThis.fetch {
  return (input: RequestInfo | URL) => {
    const url = String(input instanceof Request ? input.url : input);
    const body = url.includes("/me") ? { user: null } : { comments: [] };
    return Promise.resolve(
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
  };
}
