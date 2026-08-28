#!/usr/bin/env node
/**
 * Verifies compile-first scanner + CSS generation for test-app / test-app-webpack / test-app-next.
 * Run from Framework/: npm run test:integration-apps
 */
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { scanUsedClasses } from "../integrations/shared/scan-used-classes.mjs";
import {
  generateBuildCSSForProject,
  resolveIuiConfigPath,
  loadIuiConfig,
} from "../integrations/shared/generate-build-css.mjs";
import { resolveBuildScanOptions } from "../integrations/shared/resolve-build-scan.mjs";

const frameworkRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const monorepoRoot = join(frameworkRoot, "..");

const APPS = [
  { id: "vite", dir: "test-app", devHint: "npm run dev:test-app" },
  { id: "webpack", dir: "test-app-webpack", devHint: "npm run dev:test-app-webpack" },
  { id: "next", dir: "test-app-next", devHint: "npm run dev:test-app-next" },
];

const REQUIRED_CLASSES = [
  "flex",
  "grid",
  "p-14",
  "w-[180px]",
  "h-[80px]",
  "text-sm",
  "font-medium",
  "font-bold",
  "gap-4",
  "sm:grid-cols-2",
  "md:grid-cols-4",
  "ring-2",
  "shadow-md",
  "shadow-lg",
  "bg-brand-500",
  "hover:bg-indigo-600",
  "rounded-2xl",
  "truncate",
  "absolute",
  "z-10",
  "dark:bg-gray-800",
  "dark:text-gray-100",
];

const distMain = join(frameworkRoot, "dist", "index.esm.js");
if (!existsSync(distMain)) {
  console.error("Run `npm run build` in Framework first — dist/ is required.");
  process.exit(1);
}

let failed = false;

for (const app of APPS) {
  const appRoot = join(monorepoRoot, app.dir);
  if (!existsSync(appRoot)) {
    console.error(`[${app.id}] Missing ${app.dir}/ directory`);
    failed = true;
    continue;
  }

  const configPath = resolveIuiConfigPath(appRoot);
  const config = loadIuiConfig(configPath);
  const scanOptions = resolveBuildScanOptions(config, {}, appRoot);

  console.log(`\n[${app.id}] Scanning ${app.dir} (${scanOptions.scanDirs?.join(", ") ?? "src"}) …`);
  const scan = scanUsedClasses(appRoot, scanOptions);

  for (const cls of REQUIRED_CLASSES) {
    try {
      assert.ok(scan.classes.has(cls), `Scanner missed "${cls}" in ${app.dir}`);
    } catch (error) {
      console.error(`[${app.id}] ${error.message}`);
      failed = true;
    }
  }

  console.log(`[${app.id}] Found ${scan.classCount} classes in ${scan.fileCount} files`);

  const appScanOptions = {
    ...scanOptions,
    safelist: [],
    scanPackages: [],
  };
  const appScan = scanUsedClasses(appRoot, appScanOptions);
  console.log(
    `[${app.id}] App-only scan: ${appScan.classCount} classes in ${appScan.fileCount} files`,
  );

  console.log(`[${app.id}] Generating build CSS …`);
  const result = generateBuildCSSForProject(appRoot, { minify: false });
  const builtSet = new Set(result.builtClasses ?? []);

  let appPassed = true;

  for (const cls of REQUIRED_CLASSES) {
    if (!appScan.classes.has(cls)) {
      console.error(`[${app.id}] App scanner missed "${cls}"`);
      failed = true;
      appPassed = false;
      continue;
    }
    if (!builtSet.has(cls)) {
      console.error(`[${app.id}] JIT did not build app class "${cls}"`);
      failed = true;
      appPassed = false;
    }
  }

  const appUncovered = [...appScan.classes].filter((cls) => !builtSet.has(cls));
  if (appUncovered.length > 0) {
    console.error(
      `[${app.id}] App classes without CSS: ${appUncovered.slice(0, 20).join(", ")}${appUncovered.length > 20 ? "…" : ""}`,
    );
    failed = true;
    appPassed = false;
  }

  try {
    assert.ok(result.combinedCSS.length > 100, "combinedCSS should not be empty");
    assert.ok(
      result.combinedCSS.includes(".flex") || result.combinedCSS.includes("flex"),
      "CSS should contain flex utility",
    );
    assert.ok(
      result.combinedCSS.includes("180px") || result.combinedCSS.includes("140px"),
      "CSS should contain arbitrary width utility",
    );
  } catch (error) {
    console.error(`[${app.id}] ${error.message}`);
    failed = true;
    appPassed = false;
  }

  const safelistUncovered = (result.uncoveredClasses ?? []).filter(
    (cls) => !appScan.classes.has(cls),
  );
  if (safelistUncovered.length > 0) {
    console.log(
      `[${app.id}] Note: ${safelistUncovered.length} component manifest safelist entries were not built (known safelist noise).`,
    );
  }

  console.log(
    `[${app.id}] Generated ${result.stats.combinedBytes} bytes for ${result.stats.classCount} classes`,
  );
  if (appPassed) {
    console.log(`[${app.id}] ✔ scanner + JIT CSS verification passed.`);
    console.log(`[${app.id}] Manual: ${app.devHint}`);
  }
}

if (failed) {
  console.error("\n✖ One or more integration app verifications failed.");
  process.exit(1);
}

console.log("\n✔ All integration test apps passed scanner + JIT CSS verification.");
