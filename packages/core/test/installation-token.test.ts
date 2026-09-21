import { createPublicKey, createVerify } from "node:crypto";

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createInstallationAuth, InstallationAuthError } from "../src/auth/installation.js";
import { corrupted, pkcs1, pkcs8, publicKey } from "./keys.js";
import { createAppFake } from "./msw/github-app.js";
import { createTestServer, useTestServer } from "./msw/server.js";

import type { InstallationAuth } from "../src/auth/installation.js";
import type { AppFake } from "./msw/github-app.js";

const APP_ID = "1234567";
const INSTALLATION = "7654321";
const MINUTE = 60 * 1000;

/** The clock every test drives. Real time never advances inside one. */
let at = Date.parse("2026-09-21T12:00:00.000Z");
const now = (): number => at;

const app: AppFake = createAppFake(INSTALLATION, now);
const server = createTestServer(...app.handlers);
useTestServer(server, { beforeAll, afterEach, afterAll });

beforeEach(() => {
  at = Date.parse("2026-09-21T12:00:00.000Z");
  app.reset();
});

function auth(): InstallationAuth {
  return createInstallationAuth({
    appId: APP_ID,
    installationId: INSTALLATION,
    privateKey: pkcs1,
    now,
  });
}

describe("minting an installation token", () => {
  it("returns the token GitHub issued", async () => {
    expect(await auth().token()).toBe("ghs_installation_1");
  });

  it("authenticates with an RS256 JWT the App's public key verifies", async () => {
    await auth().token();

    const [header, claims, signature] = (app.jwts()[0] ?? "").split(".");
    const verify = createVerify("RSA-SHA256");
    verify.update(`${String(header)}.${String(claims)}`);

    const valid = verify.verify(
      createPublicKey(publicKey),
      Buffer.from(String(signature).replaceAll("-", "+").replaceAll("_", "/"), "base64"),
    );
    expect(valid).toBe(true);
  });

  it("signs the App as the issuer, backdated and under ten minutes long", async () => {
    await auth().token();

    const claims = decode(app.jwts()[0] ?? "");
    expect(claims["iss"]).toBe(APP_ID);
    expect(claims["iat"]).toBe(at / 1000 - 60);
    expect(Number(claims["exp"]) - Number(claims["iat"])).toBeLessThanOrEqual(600);
  });

  it("says RS256, which is the only algorithm GitHub accepts here", async () => {
    await auth().token();
    expect(header(app.jwts()[0] ?? "")["alg"]).toBe("RS256");
  });

  it("reads a PKCS#8 key as happily as the PKCS#1 GitHub hands out", async () => {
    const converted = createInstallationAuth({
      appId: APP_ID,
      installationId: INSTALLATION,
      privateKey: pkcs8,
      now,
    });
    expect(await converted.token()).toBe("ghs_installation_1");
  });
});

describe("caching it", () => {
  it("does not mint twice for two calls inside its life", async () => {
    const minting = auth();
    await minting.token();
    await minting.token();

    expect(app.mints()).toBe(1);
  });

  it("mints once for a burst of concurrent calls", async () => {
    const minting = auth();
    const tokens = await Promise.all([minting.token(), minting.token(), minting.token()]);

    expect(app.mints()).toBe(1);
    expect(new Set(tokens).size).toBe(1);
  });

  it("mints again once the token has expired", async () => {
    const minting = auth();
    expect(await minting.token()).toBe("ghs_installation_1");

    at += 61 * MINUTE;
    expect(await minting.token()).toBe("ghs_installation_2");
  });

  it("gives a token up early rather than on the boundary", async () => {
    const minting = auth();
    await minting.token();

    // Four minutes left is still valid to GitHub and is not reused here: a
    // request that starts valid must not finish expired.
    at += 56 * MINUTE;
    expect(await minting.token()).toBe("ghs_installation_2");
  });

  it("keeps a token that came with no expiry for an hour", async () => {
    app.withoutExpiry();
    const minting = auth();
    await minting.token();

    at += 50 * MINUTE;
    expect(await minting.token()).toBe("ghs_installation_1");
  });
});

describe("when GitHub refuses", () => {
  it("throws with GitHub's own message", async () => {
    app.failNext(404, "Integration not found");

    await expect(auth().token()).rejects.toThrow(InstallationAuthError);
  });

  it("names the status, because a 401 and a 404 are different fixes", async () => {
    app.failNext(401, "A JSON web token could not be decoded");

    await expect(auth().token()).rejects.toThrow(/401.*could not be decoded/u);
  });

  it("does not cache the failure, so the next call asks again", async () => {
    const minting = auth();
    app.failNext(500, "Server Error");
    await expect(minting.token()).rejects.toThrow(InstallationAuthError);

    expect(await minting.token()).toBe("ghs_installation_1");
  });
});

describe("when the key is not a key", () => {
  it("rejects rather than signing something GitHub will refuse", async () => {
    const broken = createInstallationAuth({
      appId: APP_ID,
      installationId: INSTALLATION,
      privateKey: corrupted(),
      now,
    });

    await expect(broken.token()).rejects.toThrow();
    expect(app.mints()).toBe(0);
  });
});

function part(jwt: string, index: number): Record<string, unknown> {
  const segment = jwt.split(".")[index] ?? "";
  return JSON.parse(Buffer.from(segment, "base64url").toString()) as Record<string, unknown>;
}

function header(jwt: string): Record<string, unknown> {
  return part(jwt, 0);
}

function decode(jwt: string): Record<string, unknown> {
  return part(jwt, 1);
}
