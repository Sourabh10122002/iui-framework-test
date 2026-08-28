#!/usr/bin/env node
/**
 * Smoke test: scan fixtures + generate build CSS via Node (compile-first pipeline).
 */
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { generateBuildCSSForProject } from "../integrations/shared/generate-build-css.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const frameworkRoot = join(__dirname, "..");
const fixtureRoot = join(
  frameworkRoot,
  "integrations/shared/__fixtures__/sample-app",
);

const sampleClasses = [
  "flex",
  "items-center",
  "gap-4",
  "p-4",
  "rounded-lg",
  "bg-primary-500",
  "text-white",
  "px-4",
  "py-2",
  "w-[120px]",
];

let failed = false;

function pass(msg) {
  console.log(`✔ ${msg}`);
}

function fail(msg) {
  console.error(`✖ ${msg}`);
  failed = true;
}

try {
  const scanned = generateBuildCSSForProject(fixtureRoot, {
    scan: { scanDirs: ["."], exclude: [] },
    config: {
      theme: {
        mode: { default: "light" },
        typography: { provider: "system", set: "inter" },
        radius: { set: "md" },
        spacing: { set: "standard" },
      },
    },
  });

  if (!scanned.combinedCSS || scanned.combinedCSS.length < 20) {
    fail("combinedCSS is empty or too short");
  } else {
    pass(`combinedCSS length=${scanned.combinedCSS.length}`);
  }

  if (!scanned.combinedCSS.includes(".flex")) {
    fail('combinedCSS missing ".flex" rule');
  } else {
    pass('contains ".flex" rule');
  }

  if (!scanned.stats || scanned.stats.classCount < 5) {
    fail("stats.classCount too low");
  } else {
    pass(`generated ${scanned.stats.classCount} utility classes`);
  }

  const explicit = generateBuildCSSForProject(fixtureRoot, {
    classes: sampleClasses,
    config: {
      theme: {
        typography: { set: "inter" },
        radius: { set: "md" },
        spacing: { set: "standard" },
      },
    },
  });

  if (!explicit.combinedCSS.includes("w-\\[120px\\]") && !explicit.combinedCSS.includes("width")) {
    fail("arbitrary w-[120px] not generated");
  } else {
    pass("arbitrary width utility generated");
  }
} catch (error) {
  fail(String(error));
  console.error(error);
}

if (failed) {
  process.exit(1);
}

console.log("\n[IUI] build-css smoke test passed.");
