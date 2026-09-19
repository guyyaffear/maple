/**
 * A media connector that keeps blobs in a Map and serves them as data URLs.
 *
 * It exists so the examples and the suites can exercise the whole screenshot
 * path — capture, upload, reference on the comment, image in the panel —
 * without a bucket. It is not for production: nothing here survives a restart,
 * and a data URL is stripped out of a pull-request body, which is the one
 * place a screenshot most needs to survive.
 */

import type { MediaConnector } from "../connectors/types.js";
import type { MediaBlob, MediaRef } from "../types.js";

/** Options for {@link memoryMedia}. */
export interface MemoryMediaOptions {
  /** Connector name reported to Maple, and kept on every ref. Defaults to `"memory"`. */
  readonly name?: string;
}

/** Creates an in-memory media connector. */
export function memoryMedia(options: MemoryMediaOptions = {}): MediaConnector {
  const name = options.name ?? "memory";
  const blobs = new Map<string, MediaBlob>();
  let next = 1;

  return {
    name,
    putBlob(blob: MediaBlob): Promise<MediaRef> {
      const key = `shot-${String(next)}`;
      next += 1;
      blobs.set(key, blob);
      return Promise.resolve({ connector: name, key, contentType: blob.contentType });
    },
    getUrl(ref: MediaRef): Promise<string> {
      const held = blobs.get(ref.key);
      if (!held) return Promise.reject(new RangeError(`No blob is held under ${ref.key}.`));
      return Promise.resolve(dataUrl(held));
    },
    remove(ref: MediaRef): Promise<void> {
      blobs.delete(ref.key);
      return Promise.resolve();
    },
  };
}

/** Base64 without a Buffer, so the same connector runs in a browser suite. */
function dataUrl(blob: MediaBlob): string {
  let binary = "";
  for (const byte of blob.data) binary += String.fromCharCode(byte);
  return `data:${blob.contentType};base64,${btoa(binary)}`;
}
