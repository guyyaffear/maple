/**
 * The route, answered without a network call.
 *
 * `MapleClientOptions.fetch` is the controller's own seam for this, so these
 * suites reach no origin at all rather than mocking one they never talk to.
 * What is under test here is the shadow root, the stylesheet and the scheme —
 * none of which depends on what the route says.
 */

/** What the offline route reports about itself, beyond an empty branch. */
export interface OfflineOptions {
  /** A link state, so the route offers a sign-in — one settings row more. */
  readonly github?: { readonly linked: boolean; readonly login?: string };
  /** Whether it keeps screenshots. True unless a suite is about the case where it does not. */
  readonly media?: boolean;
}

/** Answers `/comments` with an empty branch and `/me` with no session. */
export function offlineFetch(options: OfflineOptions = {}): typeof globalThis.fetch {
  return (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input instanceof Request ? input.url : input);
    if (url.includes("/media")) return Promise.resolve(kept(init));

    const me = {
      user: null,
      media: options.media !== false,
      ...(options.github === undefined ? {} : { github: options.github }),
    };
    const body = url.includes("/me") ? me : { comments: [] };
    return Promise.resolve(
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
  };
}

/** The route's own media endpoint, answering with the ref a comment keeps. */
function kept(init: RequestInit | undefined): Response {
  const contentType = new Headers(init?.headers).get("content-type") ?? "image/png";
  const ref = { connector: "memory", key: "shot-1", contentType };
  return new Response(JSON.stringify(ref), {
    status: 201,
    headers: { "content-type": "application/json" },
  });
}
