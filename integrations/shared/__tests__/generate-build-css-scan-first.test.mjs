/**
 * Regression: default generateBuildCSSForProject must not silently expand
 * the full shade matrix (scan-first defaults).
 */
import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { generateBuildCSSForProject } from "../generate-build-css.mjs";

test("generateBuildCSSForProject does not expand shade matrix by default", () => {
  const root = join(tmpdir(), `iui-scan-first-${Date.now()}`);
  mkdirSync(join(root, "src"), { recursive: true });
  writeFileSync(
    join(root, "iui.config.ts"),
    `export default {
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
`,
  );
  writeFileSync(
    join(root, "src", "App.tsx"),
    `export default function App() {
  return <div className="flex gap-4 p-4 text-sm">Hello</div>;
}
`,
  );

  try {
    const result = generateBuildCSSForProject(root, { minify: false });
    const scanned = result.scan?.classCount ?? 0;
    const expanded = result.expandedClassCount ?? 0;

    assert.ok(scanned >= 4, `expected scanned classes, got ${scanned}`);
    // Without shade matrix / theme presets / palette / arbitrary, expand ≈ scan
    assert.ok(
      expanded < 200,
      `default expand blew up to ${expanded} classes (scan-first regression)`,
    );
    assert.ok(
      expanded <= scanned + 50,
      `expanded (${expanded}) far exceeds scanned (${scanned}) — shade matrix likely on`,
    );
    assert.ok(
      result.combinedCSS.includes(".flex") || result.combinedCSS.includes("flex"),
      "CSS should contain flex utility",
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("literal shade classes reach final CSS and request changes invalidate output", () => {
  const root = join(tmpdir(), `iui-shade-build-${Date.now()}`);
  mkdirSync(join(root, "src"), { recursive: true });
  const config = {
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
      includeShadeMatrix: false,
      shadeDiagnostics: "error",
      minify: false,
    },
  };
  const appPath = join(root, "src", "App.tsx");
  const sourceFor = (variant) => `
    import { compose } from "@inventive-ui/framework/shade";
    export const classes = compose({
      pattern: "interactive", variant: "${variant}", appearance: "strong",
      state: "default", channel: "full", palette: "brand",
      emit: { adaptive: true },
    });
  `;

  try {
    writeFileSync(appPath, sourceFor("solid"));
    const solid = generateBuildCSSForProject(root, { config, minify: false });
    assert.ok(solid.scan.classCount > 0);
    assert.ok(solid.combinedCSS.length > 0);
    assert.match(solid.combinedCSS, /bg-brand-500/);
    assert.ok(solid.expandedClassCount < 100, "literal scan must not inflate the full matrix");

    writeFileSync(appPath, sourceFor("outline"));
    const outline = generateBuildCSSForProject(root, { config, minify: false });
    assert.notEqual(outline.cssHash, solid.cssHash);
    assert.notDeepEqual([...outline.scan.classes], [...solid.scan.classes]);

    const withMatrix = generateBuildCSSForProject(root, {
      config: {
        ...config,
        build: { ...config.build, includeShadeMatrix: true },
      },
      minify: false,
    });
    assert.ok(
      withMatrix.expandedClassCount > outline.expandedClassCount,
      "includeShadeMatrix:true must remain an explicit full-matrix escape hatch",
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
