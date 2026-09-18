/**
 * The bundle budget, asserted at build time.
 *
 * Marks and the island, with the root they need, stay under 25 KB gzipped; the
 * composer costs its own 8 KB on top. It runs as the second half of this
 * package's `build`, so the existing CI build job enforces it and no workflow
 * knows about it. It measures this package's own emitted modules: `react` is a
 * peer, and `@maple-kit/core` and `@maple-kit/react` carry their own budgets.
 */

import { readFileSync } from "node:fs";
import { dirname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const DIST = resolve(dirname(fileURLToPath(import.meta.url)), "..", "dist");

/** Each budget is the gzipped size of the modules only that column reaches. */
const BUDGETS = [
  {
    name: "root + marks + island + icons",
    entries: ["index.js", "marks/index.js", "island/index.js", "icons/index.js"],
    max: 25 * 1024,
  },
  { name: "composer, on top", entries: ["composer/index.js"], max: 8 * 1024 },
];

const RELATIVE_IMPORT = /(?:from|import)[\s(]+["'](\.[^"']+)["']/g;

function read(id) {
  return readFileSync(join(DIST, id), "utf8");
}

/** Every module reachable from an entry by a relative import, the entry included. */
function graph(entries) {
  const seen = new Set();
  const queue = [...entries];

  while (queue.length > 0) {
    const id = queue.pop();
    if (id === undefined || seen.has(id)) continue;
    seen.add(id);

    const source = read(id);
    for (const [, specifier] of source.matchAll(RELATIVE_IMPORT)) {
      queue.push(normalize(join(dirname(id), specifier)));
    }
  }
  return seen;
}

/** Gzipped bytes of the modules, concatenated in a stable order. */
function weigh(ids) {
  const sorted = [...ids].sort();
  return gzipSync(sorted.map(read).join("\n"), { level: 9 }).byteLength;
}

let failed = false;
const counted = new Set();

for (const budget of BUDGETS) {
  const own = new Set([...graph(budget.entries)].filter((id) => !counted.has(id)));
  for (const id of own) counted.add(id);

  const bytes = weigh(own);
  const kb = (bytes / 1024).toFixed(1);
  const limit = (budget.max / 1024).toFixed(0);

  if (bytes > budget.max) {
    failed = true;
    process.stderr.write(`${budget.name}: ${kb} KB gzipped, over the ${limit} KB budget\n`);
    process.stderr.write(`  ${own.size} modules: ${[...own].sort().join(", ")}\n`);
  } else {
    process.stdout.write(`${budget.name}: ${kb} KB gzipped, under ${limit} KB\n`);
  }
}

if (failed) {
  process.stderr.write("The budget is in packages/ui/scripts/size.js. Raising it is a decision.\n");
  process.exit(1);
}
