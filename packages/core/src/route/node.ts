/**
 * Adapting the web-standard handler to Node's own request and response.
 *
 * Vite's dev and preview servers speak connect middleware, and so do Express
 * and Fastify's compatibility layer. One adapter serves all three.
 */

import { Buffer } from "node:buffer";

import type { IncomingMessage, ServerResponse } from "node:http";

/** A connect-style middleware. */
export type NodeMiddleware = (
  request: IncomingMessage,
  response: ServerResponse,
  next: () => void,
) => void;

/**
 * Wraps the handler so a Node server can mount it. Requests outside `basePath`
 * are passed straight on, so this is safe to mount at the root.
 */
export function toNodeMiddleware(
  handle: (request: Request) => Promise<Response>,
  basePath: string,
): NodeMiddleware {
  return (request, response, next) => {
    const path = (request.url ?? "").split("?")[0] ?? "";
    if (!path.startsWith(basePath)) {
      next();
      return;
    }

    void serve(handle, request, response);
  };
}

async function serve(
  handle: (request: Request) => Promise<Response>,
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  const result = await handle(await toWebRequest(request));

  response.statusCode = result.status;
  result.headers.forEach((value, name) => response.setHeader(name, value));
  // Bytes, not text: a screenshot round-tripped through a UTF-8 string comes
  // back as an image no decoder will open.
  response.end(Buffer.from(await result.arrayBuffer()));
}

async function toWebRequest(request: IncomingMessage): Promise<Request> {
  const host = header(request, "host") ?? "localhost";
  const url = `http://${host}${request.url ?? "/"}`;
  const method = request.method ?? "GET";
  const empty = method === "GET" || method === "HEAD";
  const body = empty ? undefined : await readBody(request);

  return new Request(url, {
    method,
    headers: toHeaders(request),
    ...(body === undefined ? {} : { body }),
  });
}

function toHeaders(request: IncomingMessage): Headers {
  const headers = new Headers();
  for (const [name, value] of Object.entries(request.headers)) {
    if (typeof value === "string") headers.set(name, value);
    else if (Array.isArray(value)) for (const one of value) headers.append(name, one);
  }
  return headers;
}

function header(request: IncomingMessage, name: string): string | undefined {
  const value = request.headers[name];
  return typeof value === "string" ? value : value?.[0];
}

/** Bytes for the same reason the response is: an upload is usually an image. */
function readBody(request: IncomingMessage): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    request.on("data", (chunk: Buffer) => chunks.push(chunk));
    request.on("end", () => resolve(toArrayBuffer(Buffer.concat(chunks))));
    request.on("error", reject);
  });
}

/** A fresh buffer: a Node Buffer is a view into a pool it does not own. */
function toArrayBuffer(buffer: Buffer): ArrayBuffer {
  const copy = new ArrayBuffer(buffer.byteLength);
  new Uint8Array(copy).set(buffer);
  return copy;
}
