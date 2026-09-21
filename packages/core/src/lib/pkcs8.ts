/**
 * A PEM private key as the DER Web Crypto will import.
 *
 * Replaces the key-parsing half of `jose`. GitHub hands out an App's key as
 * PKCS#1 — `BEGIN RSA PRIVATE KEY` — and `crypto.subtle.importKey` accepts
 * only PKCS#8, so the one thing needed from a JOSE library is this wrap.
 * `node:crypto` reads PKCS#1 directly, but importing it would end the route's
 * promise that it runs on a Worker.
 */

/** RFC 8017's `rsaEncryption` OID and its NULL parameters, as DER. */
const RSA_ALGORITHM = new Uint8Array([
  0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00,
]);

/** RFC 5208's `version` field: PrivateKeyInfo is always version 0. */
const VERSION_ZERO = new Uint8Array([0x02, 0x01, 0x00]);

const SEQUENCE = 0x30;
const OCTET_STRING = 0x04;

/** Raised when the value handed over is not a PEM private key at all. */
export class PrivateKeyError extends Error {
  override readonly name = "PrivateKeyError";
}

/**
 * The DER `crypto.subtle.importKey("pkcs8", …)` wants, from either PEM shape.
 *
 * A PKCS#8 key is already what it wants and is only unwrapped; a PKCS#1 key
 * is the RSA key on its own, and is wrapped in the PrivateKeyInfo that names
 * the algorithm.
 */
export function toPkcs8(pem: string): Uint8Array {
  const pkcs8 = body(pem, "PRIVATE KEY");
  if (pkcs8) return decode(pkcs8);

  const pkcs1 = body(pem, "RSA PRIVATE KEY");
  if (pkcs1) return wrap(decode(pkcs1));

  throw new PrivateKeyError("Expected a PEM private key, in PKCS#1 or PKCS#8.");
}

/** The base64 between one PEM label's delimiters, or undefined for another's. */
function body(pem: string, label: string): string | undefined {
  const pattern = new RegExp(`-----BEGIN ${label}-----([\\s\\S]*?)-----END ${label}-----`, "u");
  const found = pattern.exec(pem);
  return found?.[1]?.replaceAll(/\s+/gu, "");
}

function decode(base64: string): Uint8Array {
  try {
    return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
  } catch {
    throw new PrivateKeyError("The PEM body is not valid base64.");
  }
}

/** PrivateKeyInfo ::= SEQUENCE { version, privateKeyAlgorithm, privateKey }. */
function wrap(pkcs1: Uint8Array): Uint8Array {
  const key = tagged(OCTET_STRING, pkcs1);
  const inner = concat([VERSION_ZERO, RSA_ALGORITHM, key]);
  return tagged(SEQUENCE, inner);
}

function tagged(tag: number, contents: Uint8Array): Uint8Array {
  return concat([new Uint8Array([tag]), length(contents.length), contents]);
}

/**
 * DER length: one byte below 128, and otherwise a count byte with the high
 * bit set followed by that many big-endian bytes.
 */
function length(size: number): Uint8Array {
  if (size < 0x80) return new Uint8Array([size]);

  const bytes: number[] = [];
  for (let rest = size; rest > 0; rest = Math.floor(rest / 256)) bytes.unshift(rest % 256);

  return new Uint8Array([0x80 | bytes.length, ...bytes]);
}

function concat(parts: readonly Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const joined = new Uint8Array(total);

  let offset = 0;
  for (const part of parts) {
    joined.set(part, offset);
    offset += part.length;
  }

  return joined;
}
