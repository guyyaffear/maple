import { withMaple } from "@maple-kit/core/next";

import type { NextConfig } from "next";

// Preview builds tag; every other build strips. `withMaple` is what makes that
// one flag rather than two settings that can silently disagree — a rule that
// adds the attributes and a pass that takes them away again.
const preview = process.env["MAPLE_PREVIEW"] === "1";

// Verification only, and the reason this file has three modes rather than two:
// a production build does not tag at all, so asserting it is clean proves only
// that nothing happened. This mode tags *and* strips, which is what actually
// exercises reactRemoveProperties. See scripts/verify.ts.
const stripCheck = process.env["MAPLE_STRIP_CHECK"] === "1";

function distDir(): string {
  if (preview) return ".next-preview";
  return stripCheck ? ".next-strip" : ".next";
}

const base: NextConfig = { distDir: distDir() };
const tagging = withMaple(base, { preview: true });
const stripping = withMaple(base, { preview: false });

// The one build that does both, spelled out here because `withMaple` will not
// produce it: taking the tagging half of one and the stripping half of the
// other is exactly the mistake it exists to make impossible by accident.
const both: NextConfig = {
  ...stripping,
  ...(tagging.turbopack === undefined ? {} : { turbopack: tagging.turbopack }),
};

function chosen(): NextConfig {
  if (stripCheck) return both;
  return preview ? tagging : stripping;
}

export default chosen();
