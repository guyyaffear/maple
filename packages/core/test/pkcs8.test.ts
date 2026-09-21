import { describe, expect, it } from "vitest";

import { PrivateKeyError, toPkcs8 } from "../src/lib/pkcs8.js";
import { corrupted, pkcs1, pkcs8, pkcs8Der, publicKey } from "./keys.js";

describe("reading a PEM private key", () => {
  it("wraps a PKCS#1 key into the DER node writes for the same key", () => {
    // Equal bytes checks the algorithm identifier and every length byte at once.
    expect(Buffer.from(toPkcs8(pkcs1))).toEqual(pkcs8Der);
  });

  it("unwraps a PKCS#8 key to the DER it already holds", () => {
    expect(Buffer.from(toPkcs8(pkcs8))).toEqual(pkcs8Der);
  });

  it("tolerates a key whose lines were rewrapped or indented", () => {
    expect(Buffer.from(toPkcs8(pkcs1.replaceAll("\n", "\n  ")))).toEqual(pkcs8Der);
  });

  it("refuses something that is not a PEM private key", () => {
    expect(() => toPkcs8("not a key")).toThrow(PrivateKeyError);
  });

  it("refuses a public key, which is a PEM and cannot sign", () => {
    expect(() => toPkcs8(publicKey)).toThrow(PrivateKeyError);
  });

  it("names the base64 when the body is corrupt", () => {
    expect(() => toPkcs8(corrupted())).toThrow(/base64/u);
  });
});

describe("the DER it produces", () => {
  it("is importable by the Web Crypto the signer uses", async () => {
    const imported = await crypto.subtle.importKey(
      "pkcs8",
      toPkcs8(pkcs1) as unknown as ArrayBuffer,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"],
    );

    expect(imported.type).toBe("private");
  });
});
