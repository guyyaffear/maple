/**
 * Driving a real browser over a deployed preview.
 *
 * Two passes run at every viewport: one as a reviewer sees the page, and one
 * with reduced motion emulated, which is the only way to tell a page that
 * honours the query from one that hard-codes its motion.
 */

import { chromium } from "playwright";

import { readTokenFiles, type TokenSet } from "../tokens.js";
import { collectStyleRecords } from "./collect.js";
import { reducedMotionFindings, renderedFindings } from "./rules.js";

import type { Finding } from "../types.js";
import type { StyleRecord } from "./collect.js";
import type { Browser, BrowserContext } from "playwright";

/** One size the page is judged at. */
export interface Viewport {
  readonly width: number;
  readonly height: number;
}

/** The viewports used when a host configures none: a phone, a tablet, a laptop. */
export const DEFAULT_VIEWPORTS: readonly Viewport[] = [
  { width: 375, height: 812 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
];

/** What a rendered run needs to know. */
export interface RenderedLintOptions {
  /** The preview's URL. */
  readonly url: string;
  /** CSS files the token set is read from, the same ones the static tier uses. */
  readonly tokenFiles: readonly string[];
  readonly viewports?: readonly Viewport[];
  /**
   * The preview platform's bypass, sent as request headers. Reviewer cookies
   * are never used: a lint run is CI's and does not borrow a person's session.
   */
  readonly bypassHeaders?: Readonly<Record<string, string>>;
  /** An already-launched browser, which a test supplies and a run does not. */
  readonly browser?: Browser;
}

/** Findings from one viewport, kept apart so a dedupe can say where they were. */
export interface Pass {
  readonly viewport: Viewport;
  readonly findings: readonly Finding[];
}

function label(viewport: Viewport): string {
  return `${viewport.width}×${viewport.height}`;
}

/** Opens a page, reads it, and closes the context it opened. */
async function collect(context: BrowserContext, url: string): Promise<StyleRecord[]> {
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: "networkidle" });
    return await page.evaluate(collectStyleRecords);
  } finally {
    await context.close();
  }
}

/** Both passes at one viewport. */
async function auditViewport(
  browser: Browser,
  options: RenderedLintOptions,
  viewport: Viewport,
  tokens: TokenSet,
): Promise<Pass> {
  const shared = {
    viewport,
    ...(options.bypassHeaders === undefined ? {} : { extraHTTPHeaders: options.bypassHeaders }),
  };
  const seen = await collect(await browser.newContext(shared), options.url);
  const reduced = await collect(
    await browser.newContext({ ...shared, reducedMotion: "reduce" }),
    options.url,
  );
  return {
    viewport,
    findings: [...renderedFindings(seen, tokens), ...reducedMotionFindings(reduced)],
  };
}

function keyOf(found: Finding): string {
  return `${found.rule}|${found.anchor.selector ?? ""}|${found.message}`;
}

/**
 * One finding per place per rule. A finding at every viewport reads as it was
 * written; one at only some names them, because "only on the phone" is most of
 * what the reader needs to know.
 */
export function dedupe(passes: readonly Pass[]): readonly Finding[] {
  const groups = new Map<string, { found: Finding; at: string[] }>();
  for (const pass of passes) {
    for (const found of pass.findings) {
      const group = groups.get(keyOf(found)) ?? { found, at: [] };
      group.at.push(label(pass.viewport));
      groups.set(keyOf(found), group);
    }
  }
  return [...groups.values()].map(({ found, at }) =>
    at.length === passes.length
      ? found
      : { ...found, message: `${found.message} At ${at.join(", ")}.` },
  );
}

/**
 * Lints a live preview. Launches Chromium unless a browser is supplied, and
 * closes only what it opened.
 */
export async function lintRendered(options: RenderedLintOptions): Promise<readonly Finding[]> {
  const tokens = await readTokenFiles(options.tokenFiles);
  const viewports = options.viewports ?? DEFAULT_VIEWPORTS;
  const browser = options.browser ?? (await chromium.launch());
  try {
    const passes: Pass[] = [];
    for (const viewport of viewports) {
      passes.push(await auditViewport(browser, options, viewport, tokens));
    }
    return dedupe(passes);
  } finally {
    if (options.browser === undefined) await browser.close();
  }
}
