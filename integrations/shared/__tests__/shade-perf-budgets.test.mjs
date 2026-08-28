/**
 * Stage F — Performance / bundle budgets for shade migration.
 * Baseline in shade-perf-budgets.json; fails on gross regression.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { tmpdir } from "os";
import { gzipSync } from "zlib";
import { performance } from "perf_hooks";
import { createRequire } from "module";
import { rollup } from "rollup";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { generateBuildCSSForProject } from "../generate-build-css.mjs";
import { scanUsedClasses } from "../scan-used-classes.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const frameworkRoot = join(__dirname, "../../..");
const budgetsPath = join(__dirname, "../__fixtures__/shade-perf-budgets.json");
const lastRunPath = join(tmpdir(), "iui-shade-perf-last-run.json");
const requireFromHere = createRequire(join(frameworkRoot, "package.json"));

function gzipBytes(buf) {
  return gzipSync(buf).length;
}

function assertBudget(label, actual, baseline, tolerancePct) {
  const max = Math.floor(baseline * (1 + tolerancePct));
  assert.ok(
    actual <= max,
    `${label}: ${actual} exceeds baseline ${baseline} +${(tolerancePct * 100).toFixed(0)}% (max ${max})`,
  );
}

function assertMax(label, actual, max) {
  assert.ok(actual <= max, `${label}: ${actual} exceeds max ${max}`);
}

async function bundleConsumer(entrySource, entryName) {
  const work = mkdtempSync(join(tmpdir(), `iui-${entryName}-`));
  try {
    const entry = join(work, "entry.js");
    writeFileSync(entry, entrySource);
    const bundle = await rollup({
      input: entry,
      treeshake: { moduleSideEffects: false },
      plugins: [
        {
          name: "alias-framework",
          resolveId(id) {
            if (id === "@inventive-ui/framework") {
              return join(frameworkRoot, "dist/index.esm.js");
            }
            if (id === "@inventive-ui/framework/shade") {
              return join(frameworkRoot, "dist/shade.esm.js");
            }
            return null;
          },
        },
        resolve({ browser: true }),
        commonjs(),
      ],
      onwarn() {},
    });
    const { output } = await bundle.generate({ format: "esm" });
    await bundle.close();
    return output.map((chunk) => ("code" in chunk ? chunk.code : "")).join("\n");
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

test("bundle size budgets for root and /shade (raw + gzip)", () => {
  const budgets = JSON.parse(readFileSync(budgetsPath, "utf8"));
  const tol = budgets.tolerancePct ?? 0.2;
  const measured = {};

  for (const [key, file] of [
    ["shade.esm", "dist/shade.esm.js"],
    ["shade.cjs", "dist/shade.cjs"],
    ["index.esm", "dist/index.esm.js"],
    ["index.cjs", "dist/index.cjs"],
  ]) {
    const path = join(frameworkRoot, file);
    assert.ok(existsSync(path), `missing ${path}; run npm run build`);
    const raw = readFileSync(path);
    measured[key] = { raw: raw.length, gzip: gzipBytes(raw) };
    const b = budgets.bundles[key];
    assertBudget(`${key} raw`, measured[key].raw, b.raw, tol);
    assertBudget(`${key} gzip`, measured[key].gzip, b.gzip, tol);
  }

  writeFileSync(
    lastRunPath,
    JSON.stringify({ measuredAt: new Date().toISOString(), bundles: measured }, null, 2),
  );
});

test("tree-shaken consumer importing only cn must not retain shade", async () => {
  const budgets = JSON.parse(readFileSync(budgetsPath, "utf8"));
  const code = await bundleConsumer(
    `import { cn } from "@inventive-ui/framework";\nexport const x = cn("flex", "gap-2");\n`,
    "cn-only",
  );

  assertMax("cn-only bundle bytes", code.length, budgets.treeShake.cnOnlyMaxBytes);
  for (const pattern of budgets.treeShake.cnForbiddenPatterns) {
    assert.doesNotMatch(
      code,
      new RegExp(pattern),
      `cn-only bundle unexpectedly retained shade marker: ${pattern}`,
    );
  }
});

test("consumer importing shade /shade stays within size budget", async () => {
  const budgets = JSON.parse(readFileSync(budgetsPath, "utf8"));
  const code = await bundleConsumer(
    `import { compose, shade } from "@inventive-ui/framework/shade";
export const a = compose({
  pattern: "interactive", variant: "solid", appearance: "strong",
  state: "default", channel: "full", palette: "brand", emit: { adaptive: true },
});
export const b = shade.compose({
  pattern: "interactive", variant: "outline", appearance: "strong",
  state: "default", channel: "full", palette: "brand", emit: { adaptive: true },
});
`,
    "shade-import",
  );

  assert.ok(code.length > 5_000, "shade import bundle should include composer implementation");
  assertMax("shade import bundle bytes", code.length, budgets.treeShake.shadeImportMaxBytes);
  assert.equal(typeof requireFromHere(join(frameworkRoot, "dist/shade.cjs")).compose, "function");
});

test("scanner/build wall time: scan-first stays lean vs matrix", () => {
  const budgets = JSON.parse(readFileSync(budgetsPath, "utf8"));
  const root = mkdtempSync(join(tmpdir(), "iui-perf-scan-"));
  mkdirSync(join(root, "src"), { recursive: true });
  writeFileSync(
    join(root, "src", "App.tsx"),
    `
    import { compose } from "@inventive-ui/framework/shade";
    export const classes = compose({
      pattern: "interactive", variant: "solid", appearance: "strong",
      state: "default", channel: "full", palette: "brand",
      emit: { adaptive: true },
    });
    export default function App() {
      return <div className={"flex gap-2 p-2 " + classes}>Hi</div>;
    }
    `,
  );

  const baseConfig = {
    theme: {
      colors: {
        brand: { set: "#6366f1" },
        semantic: { success: "#22c55e", warning: "#f59e0b", danger: "#ef4444", info: "#3b82f6" },
        neutral: { base: "gray" },
      },
    },
    build: {
      scanDirs: ["src"],
      scanPackages: [],
      packageSafelist: false,
      includeThemePresets: false,
      resolvePalettePatterns: false,
      includeArbitraryScan: false,
      minify: false,
    },
  };

  try {
    scanUsedClasses(root, { scanDirs: ["src"], shadeDiagnostics: "silent" });
    generateBuildCSSForProject(root, {
      config: { ...baseConfig, build: { ...baseConfig.build, includeShadeMatrix: false } },
      minify: false,
    });

    const t0 = performance.now();
    const scan = scanUsedClasses(root, { scanDirs: ["src"], shadeDiagnostics: "silent" });
    const scanMs = performance.now() - t0;

    const t1 = performance.now();
    const scanFirst = generateBuildCSSForProject(root, {
      config: { ...baseConfig, build: { ...baseConfig.build, includeShadeMatrix: false } },
      minify: false,
    });
    const scanFirstMs = performance.now() - t1;

    const t2 = performance.now();
    const withMatrix = generateBuildCSSForProject(root, {
      config: { ...baseConfig, build: { ...baseConfig.build, includeShadeMatrix: true } },
      minify: false,
    });
    const matrixMs = performance.now() - t2;

    assert.ok(scan.classCount > 0);
    assertMax("scan-first expanded classes", scanFirst.expandedClassCount, budgets.timing.scanFirstMaxClasses);
    assert.ok(
      withMatrix.expandedClassCount >
        scanFirst.expandedClassCount * budgets.timing.matrixMinClassMultiple,
      `matrix (${withMatrix.expandedClassCount}) should dwarf scan-first (${scanFirst.expandedClassCount})`,
    );

    assertMax("scan wall ms", scanMs, budgets.timing.scanMsMax);
    assertMax("scan-first build wall ms", scanFirstMs, budgets.timing.scanFirstBuildMsMax);
    assertMax("matrix build wall ms", matrixMs, budgets.timing.matrixBuildMsMax);

    const prev = existsSync(lastRunPath)
      ? JSON.parse(readFileSync(lastRunPath, "utf8"))
      : {};
    writeFileSync(
      lastRunPath,
      JSON.stringify(
        {
          ...prev,
          measuredAt: new Date().toISOString(),
          timing: {
            scanMs,
            scanFirstMs,
            matrixMs,
            scanFirstClasses: scanFirst.expandedClassCount,
            matrixClasses: withMatrix.expandedClassCount,
          },
        },
        null,
        2,
      ),
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
