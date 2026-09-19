---
"@maple-kit/core": minor
"@maple-kit/ui": minor
---

Screenshots have somewhere to go, and every way of not having one says so.

Maple captured the page at pick time and then dropped it. `MediaConnector` was
a contract with no route behind it, and `Maple.Attachments` only attached an
image when the host application passed it an `upload` function — so a default
installation previewed a thumbnail and lost it on send. The three ways not to
end up with a screenshot all rendered as the same grey line asking for a paste,
which reads as a tool that never took one.

**The route carries media now.** `RouteOptions.media` takes a `MediaConnector`
or a per-request `MediaResolver`, the same shape `store` has, and serves:

- `POST {base}/media` — the bytes in, the `MediaRef` back.
- `GET {base}/media/{key}?type=…` — a redirect to the connector's own URL,
  because a signed URL is the point of `getUrl` and proxying every screenshot
  would put them on the application's budget. A `data:` URL is served instead
  of redirected to, since a browser refuses to follow one.
- `GET /me` now reports `media`, so the overlay knows before it offers anything.

**Breaking.** `Maple.Attachments`'s `upload` and `resolve` are overrides rather
than requirements: without them the strip posts to the route and reads back
from it. `MapleClient` gains `uploadMedia` and `mediaUrl`, so a Svelte binding
gets the same default. `ShotStore` holds a `Shot` — an image **or** a reason it
failed — rather than a `PastedImage`, and `ComposerScopeValue.offer` takes the
`MediaSource`, so a stored comment can say whether Maple took the picture or
the author did.

**A screenshot used to arrive corrupt through the Node adapter.**
`toNodeMiddleware` read the request body with `setEncoding("utf8")` and wrote
the response with `response.end(await result.text())`. Both round-trip bytes
through a UTF-8 string, so an uploaded PNG came back as an image no decoder
opens — and nothing on either side said so. It carries bytes now.

New: `memoryMedia()` in `@maple-kit/core/testing`, so the examples and the
suites exercise capture → upload → reference → image without a bucket. The Vite
example uses it, and its seeded screenshots go in through the same `putBlob` a
capture uses rather than through a resolver written for the demo.

`@zumer/snapdom` stays an optional peer — 550 KB for a transform a server-only
use of the route never reaches, behind a dynamic import — but skipping it is no
longer silent. `docs/screenshots.md` is the whole path and that reasoning.
