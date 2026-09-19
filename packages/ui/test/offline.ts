/**
 * The route, answered without a network call.
 *
 * `MapleClientOptions.fetch` is the controller's own seam for this, so these
 * suites reach no origin at all rather than mocking one they never talk to.
 * What is under test here is the shadow root, the stylesheet and the scheme —
 * none of which depends on what the route says.
 */

/**
 * Answers `/comments` with an empty branch and `/me` with no session. Pass a
 * link state to have the route offer a sign-in, which is one settings row more.
 */
export function offlineFetch(github?: {
  linked: boolean;
  login?: string;
}): typeof globalThis.fetch {
  return (input: RequestInfo | URL) => {
    const url = String(input instanceof Request ? input.url : input);
    const me = { user: null, ...(github === undefined ? {} : { github }) };
    const body = url.includes("/me") ? me : { comments: [] };
    return Promise.resolve(
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
  };
}
