/**
 * The Next integration: one wrapper that owns both halves of tagging.
 *
 * Tagging a build takes two settings that have to agree — a loader that adds
 * the attributes and a dead-attribute pass that must not remove them on the
 * same build. Wired by hand they disagree silently: the page renders, nothing
 * warns, and every comment anchors to "this page" with no name and no file.
 * Both real ways to get that wrong are in `docs/tagger.md`; this is the fix
 * for both, because one flag now drives both settings.
 */

import { ATTRIBUTE_PATTERN } from "../tagger/attributes.js";

/** The loader specifier, which is also what a hand-written config would name. */
export const MAPLE_LOADER = "@maple-kit/core/loader";

/**
 * A filename glob, not a path one. Turbopack matches a rule key containing a
 * separator against the whole path, so `src/**` never matches and the tagger
 * silently does nothing — one of the two ways this used to go wrong.
 */
export const TAGGED_FILES = "*.tsx";

/**
 * The parts of a Next config this touches, typed loosely on purpose: `next` is
 * not a dependency here, and a narrower shape would refuse the real
 * `NextConfig` under `exactOptionalPropertyTypes`.
 */
export interface NextConfigLike {
  readonly compiler?: unknown;
  readonly turbopack?: unknown;
  readonly webpack?: unknown;
}

type Bag = Record<string, unknown>;

/** How the build is set up. */
export interface WithMapleOptions {
  /**
   * Whether this build is a preview. True tags and keeps the attributes;
   * false strips them. It is the only switch, so the two halves cannot differ.
   */
  readonly preview: boolean;
  /** Directory emitted paths are relative to. Defaults to the build's own root. */
  readonly root?: string;
  /** Extra attribute patterns the application wants stripped from production. */
  readonly removeProperties?: readonly string[];
}

/** Raised when a config already sets something `withMaple` has to own. */
export class MapleConfigError extends Error {
  override readonly name = "MapleConfigError";
}

/**
 * Wraps a Next config so Maple tags a preview build and no other.
 *
 * ```ts
 * export default withMaple(config, { preview: process.env.VERCEL_ENV === "preview" });
 * ```
 *
 * Throws rather than merging when the config already sets
 * `compiler.reactRemoveProperties`: that field decides whether the tagger's
 * work survives, and two owners for it is the bug this exists to prevent.
 * Pass the patterns through `removeProperties` instead.
 */
export function withMaple<T extends NextConfigLike>(config: T, options: WithMapleOptions): T {
  const compiler = (config.compiler ?? {}) as Bag;
  if (compiler["reactRemoveProperties"] !== undefined) {
    throw new MapleConfigError(
      "withMaple owns compiler.reactRemoveProperties, because it decides whether the " +
        "tagger's attributes survive the build. Pass extra patterns as removeProperties.",
    );
  }

  const webpack = webpackWith(config.webpack, options);
  const turbopack = { ...(config.turbopack as Bag | undefined), rules: rulesFor(config, options) };

  return {
    ...config,
    compiler: {
      ...compiler,
      // False on a preview, so the attributes the loader just added survive.
      reactRemoveProperties: options.preview ? false : { properties: stripped(options) },
    },
    ...(options.preview ? { turbopack } : {}),
    ...(webpack === undefined ? {} : { webpack }),
  };
}

/** Maple's own pattern first, then whatever else the application strips. */
function stripped(options: WithMapleOptions): string[] {
  return [ATTRIBUTE_PATTERN, ...(options.removeProperties ?? [])];
}

function loaderRule(options: WithMapleOptions) {
  const root = options.root;
  return { loader: MAPLE_LOADER, options: root === undefined ? {} : { root } };
}

/** The application's own rules, plus the one that tags. Preview builds only. */
function rulesFor(config: NextConfigLike, options: WithMapleOptions): Bag {
  const existing = ((config.turbopack as Bag | undefined)?.["rules"] ?? {}) as Bag;
  return { ...existing, [TAGGED_FILES]: { loaders: [loaderRule(options)] } };
}

/** The part of a webpack config a rule is pushed onto. */
interface WebpackConfigLike {
  module?: { rules?: unknown[] };
}

type WebpackHook = (config: WebpackConfigLike, context: unknown) => WebpackConfigLike;

/**
 * `next dev --webpack` is a real escape hatch, and a build that quietly stops
 * tagging when it is taken is the same silence in a second place.
 */
function webpackWith(existing: unknown, options: WithMapleOptions): unknown {
  if (!options.preview) return existing;
  const before = existing as WebpackHook | undefined;

  return (config: WebpackConfigLike, context: unknown): WebpackConfigLike => {
    const built = before ? before(config, context) : config;
    const rules = built.module?.rules ?? [];
    rules.push({ test: /\.tsx$/, exclude: /node_modules/, use: [loaderRule(options)] });
    return { ...built, module: { ...built.module, rules } };
  };
}
