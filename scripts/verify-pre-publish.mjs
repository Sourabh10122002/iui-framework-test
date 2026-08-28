#!/usr/bin/env node
/**
 * Optional full pre-publish gate for @inventive-ui/framework.
 *
 * Same pattern as @inventive-ui/components:
 * - `npm publish` → `prepublishOnly` → build only
 * - Heavy checks → CI, or manually: `npm run prepublish:check`
 *
 * Run: npm run verify:pre-publish
 * Full flow (build + gates): npm run prepublish:check
 */
import { execSync } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** @type {{ name: string; cmd: string }[]} */
const STEPS = [
  {
    name: "Compile-first scan + build-css",
    cmd: "npm run test:compile",
  },
  {
    name: "SSR, performance, and packed-consumer gates",
    cmd: "npm run test:shade-gates",
  },
  {
    name: "Package surface (publint, attw, CJS require)",
    cmd: "npm run verify:pack",
  },
  {
    name: "Unit tests (Jest)",
    cmd: "npm test",
  },
];

/**
 * @param {{ name: string; cmd: string }} step
 * @param {number} index
 */
function runStep(step, index) {
  const label = `[prepublish:check ${index + 1}/${STEPS.length}]`;
  console.log(`\n${"=".repeat(60)}`);
  console.log(`${label} ${step.name}`);
  console.log(`${"=".repeat(60)}\n`);

  try {
    execSync(step.cmd, {
      cwd: root,
      stdio: "inherit",
      env: process.env,
      shell: true,
    });
    console.log(`\n${label} PASSED\n`);
  } catch (error) {
    const code =
      error && typeof error === "object" && "status" in error
        ? error.status
        : 1;
    console.error(`\n${label} FAILED — ${step.name}\n`);
    process.exit(typeof code === "number" ? code : 1);
  }
}

console.log("\n@inventive-ui/framework — prepublish:check verification\n");
console.log(
  "Assumes dist/ is already built. Use `npm run prepublish:check` to build first.\n",
);

for (let i = 0; i < STEPS.length; i++) {
  runStep(STEPS[i], i);
}

console.log("All prepublish checks passed. Ready to publish.\n");
