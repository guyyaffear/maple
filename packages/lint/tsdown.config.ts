import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  unbundle: true,
  fixedExtension: false,
  target: "node24",
  outputOptions: { comments: { annotation: true, jsdoc: false, legal: true } },
});
