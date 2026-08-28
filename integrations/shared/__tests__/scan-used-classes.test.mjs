import test from "node:test";
import assert from "node:assert/strict";
import {
  readFileSync,
  mkdtempSync,
  writeFileSync,
  mkdirSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  extractClassesFromSource,
  scanUsedClasses,
} from "../scan-used-classes.mjs";
import { isStaticUtilityToken } from "../utility-token-filter.mjs";
import { scanArbitraryClasses } from "../scan-arbitrary-classes.mjs";
import { scanPalettePatternsFromSource } from "../scan-palette-patterns.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixtureRoot = join(__dirname, "..", "__fixtures__", "sample-app");
const sampleSource = readFileSync(join(fixtureRoot, "Sample.tsx"), "utf8");

test("extractClassesFromSource finds className literals", () => {
  const classes = extractClassesFromSource(sampleSource);
  assert.ok(classes.has("flex"));
  assert.ok(classes.has("items-center"));
  assert.ok(classes.has("gap-4"));
  assert.ok(classes.has("p-4"));
  assert.ok(classes.has("w-[120px]"));
});

test("extractClassesFromSource finds cn() string literals", () => {
  const classes = extractClassesFromSource(sampleSource);
  assert.ok(classes.has("text-sm"));
  assert.ok(classes.has("font-medium"));
});

test("scanUsedClasses scans fixture directory", () => {
  const result = scanUsedClasses(fixtureRoot, {
    scanDirs: ["."],
    exclude: [],
  });
  assert.ok(result.classCount >= 8);
  assert.ok(result.classes.has("flex"));
});

test("utility filter rejects prose and CSS property names", () => {
  assert.equal(isStaticUtilityToken("flex"), true);
  assert.equal(isStaticUtilityToken("flex-wrap"), true);
  assert.equal(isStaticUtilityToken("flex-wrap-reverse"), true);
  assert.equal(isStaticUtilityToken("flex-nowrap"), true);
  assert.equal(isStaticUtilityToken("bg-brand-500"), true);
  assert.equal(isStaticUtilityToken("align-items"), false);
  assert.equal(isStaticUtilityToken("flex-direction"), false);
  assert.equal(isStaticUtilityToken("./components/Button"), false);
  assert.equal(isStaticUtilityToken("background-color"), false);
});

test("utility filter rejects scan pollution from JS string debris", () => {
  assert.equal(isStaticUtilityToken('border-transparent";'), false);
  assert.equal(isStaticUtilityToken('border-transparent",'), false);
  assert.equal(isStaticUtilityToken('"hover:border-transparent'), false);
  assert.equal(isStaticUtilityToken('gap-1.5",'), false);
  assert.equal(isStaticUtilityToken("start-0\""), false);
  assert.equal(
    isStaticUtilityToken(
      "allAppearancesOnActive[appearance].lightMode[onActive],",
    ),
    false,
  );
  assert.equal(
    isStaticUtilityToken('[tabindex]:not([tabindex="-1"])'),
    false,
  );
  // Valid tokens still accepted
  assert.equal(isStaticUtilityToken("border-transparent"), true);
  assert.equal(isStaticUtilityToken("gap-1.5"), true);
  assert.equal(isStaticUtilityToken("hover:border-transparent"), true);
  assert.equal(isStaticUtilityToken("dark:border-transparent"), true);
  assert.equal(isStaticUtilityToken("w-[120px]"), true);
  assert.equal(isStaticUtilityToken("content-['']"), true);
  assert.equal(isStaticUtilityToken("HELPER_TEXT_BASE_SIZES[size]"), false);
  assert.equal(isStaticUtilityToken('TextProps["size"]'), false);
  assert.equal(isStaticUtilityToken("V_PADDING_MATRIX[size]"), false);
  assert.equal(
    isStaticUtilityToken('w-[" + fixedContainerWidth + "px]'),
    false,
  );
});

test("extractClassesFromSource finds object-map style table literals", () => {
  const source = `
    const lookup = {
      brand: "bg-brand-500 text-white",
      danger: "bg-danger-500 text-white",
    };
    const stack = ["z-10", "z-20"];
  `;
  const classes = extractClassesFromSource(source, "styles.ts");
  assert.ok(classes.has("bg-brand-500"));
  assert.ok(classes.has("text-white"));
  assert.ok(classes.has("bg-danger-500"));
  assert.ok(classes.has("z-10"));
  assert.ok(classes.has("z-20"));
});

test("extractClassesFromSource finds exported logical inset class constants", () => {
  const source = `
    export const RAIL_CLASS = "fixed end-6 start-4 top-1/2";
  `;
  const classes = extractClassesFromSource(source, "layout.ts");
  assert.ok(classes.has("end-6"));
  assert.ok(classes.has("start-4"));
  assert.ok(classes.has("fixed"));
  assert.equal(classes.has("right-6"), false);
});

test("scanArbitraryClasses finds arbitrary tokens outside className", () => {
  const source = `
    const width = "w-[120px]";
    const height = "h-[80px]";
    export const x = width;
  `;
  const dir = mkdtempSync(join(tmpdir(), "iui-arbitrary-"));
  mkdirSync(join(dir, "src"), { recursive: true });
  writeFileSync(join(dir, "src", "tokens.ts"), source);
  try {
    const classes = scanArbitraryClasses(dir, { scanDirs: ["src"] });
    assert.ok(classes.has("w-[120px]"));
    assert.ok(classes.has("h-[80px]"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("scanPalettePatternsFromSource detects bg-${paletteName}-500", () => {
  const source = `
    export function getBg(paletteName = "brand") {
      return \`bg-\${paletteName}-500\`;
    }
  `;
  const signals = scanPalettePatternsFromSource(source, "color.ts");
  assert.equal(signals.patterns.length, 1);
  assert.equal(signals.patterns[0].property, "bg");
  assert.equal(signals.patterns[0].shade, "500");
  assert.equal(signals.patterns[0].paletteVar, "paletteName");
  assert.equal(signals.paletteDefaults.get("paletteName"), "brand");
});

test("scanPalettePatternsFromSource detects hover:dark:bg-${color}-600", () => {
  const source = `const cls = \`hover:dark:bg-\${color}-600\`;`;
  const signals = scanPalettePatternsFromSource(source, "color.ts");
  assert.equal(signals.patterns[0].variantPrefix, "hover:dark");
  assert.equal(signals.patterns[0].shade, "600");
});
