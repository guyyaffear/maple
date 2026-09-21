/**
 * One RSA key pair for the suites that sign with one.
 *
 * Generated rather than committed: a private key in a fixture is a credential
 * in the tree whatever it was minted for, and gitleaks is right to say so.
 */

import { createPrivateKey, generateKeyPairSync } from "node:crypto";

const generated = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs1", format: "pem" },
});

/** The private key as PKCS#1, which is the shape GitHub hands an App's key out in. */
export const pkcs1 = generated.privateKey;

/** The public half, for verifying a signature this key made. */
export const publicKey = generated.publicKey;

const parsed = createPrivateKey(pkcs1);

/** The same key as PKCS#8, the only shape `crypto.subtle.importKey` accepts. */
export const pkcs8 = parsed.export({ type: "pkcs8", format: "pem" }).toString();

/** The DER node writes for it — the reference `toPkcs8` is checked against. */
export const pkcs8Der = Buffer.from(parsed.export({ type: "pkcs8", format: "der" }));

/**
 * A real PEM envelope around a body that is not base64, for the paths that
 * have to refuse one. Derived from a generated key so that no key delimiter is
 * ever written into this repository.
 */
export function corrupted(pem: string = pkcs1): string {
  const lines = pem.trim().split("\n");
  return [lines[0], "!!!!", lines.at(-1)].join("\n");
}
