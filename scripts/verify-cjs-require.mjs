#!/usr/bin/env node
/**
 * Smoke-test CJS require paths for framework exports.
 */
import { createRequire } from "module";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const require = createRequire(import.meta.url);

const entries = [
  "dist/index.cjs",
  "dist/slots.cjs",
  "dist/shade.cjs",
  "dist/server/index.cjs",
  "dist/node/build-css-api.cjs",
];

let failed = false;

for (const rel of entries) {
  const abs = join(root, rel);
  if (!existsSync(abs)) {
    console.error(`[cjs-require] MISSING ${rel}`);
    failed = true;
    continue;
  }
  try {
    require(abs);
    console.log(`[cjs-require] OK ${rel}`);
  } catch (error) {
    failed = true;
    console.error(`[cjs-require] FAIL ${rel}:`, error.message);
  }
}

if (failed) process.exit(1);
console.log("\n[cjs-require] PASSED\n");
