import { defineConfig } from "tsdown";

const COMMENTS = { comments: { annotation: true, jsdoc: false, legal: true } };

export default defineConfig([
  {
    entry: ["src/index.ts"],
    format: ["esm"],
    dts: true,
    clean: true,
    unbundle: true,
    fixedExtension: false,
    target: "node24",
    outputOptions: COMMENTS,
  },
  /**
   * The page bundle, aimed at a browser: it is injected into whatever the
   * preview is, so it arrives as one file carrying the cascade it calls.
   */
  {
    entry: ["src/rendered/page.ts"],
    format: ["iife"],
    dts: false,
    clean: false,
    unbundle: false,
    fixedExtension: false,
    platform: "browser",
    target: "chrome120",
    outDir: "dist/page",
    noExternal: [/^@maple-kit\//],
    outputOptions: COMMENTS,
  },
]);
