import test from "node:test";
import assert from "node:assert/strict";
import { scanPalettePatternsFromSource } from "../scan-palette-patterns.mjs";

test("bare bg-${palette}-500 has empty variantPrefix (not b:)", () => {
  const { patterns } = scanPalettePatternsFromSource(
    "const x = `bg-${palette}-500`;",
    "t.ts",
  );
  assert.equal(patterns.length, 1);
  assert.equal(patterns[0].variantPrefix, "");
  assert.equal(patterns[0].property, "bg");
  assert.equal(patterns[0].paletteVar, "palette");
  assert.equal(patterns[0].shade, "500");
});

test("dark:text-${color}-500 keeps dark variant prefix", () => {
  const { patterns } = scanPalettePatternsFromSource(
    "const x = `dark:text-${color}-500`;",
    "t.ts",
  );
  assert.equal(patterns.length, 1);
  assert.equal(patterns[0].variantPrefix, "dark");
  assert.equal(patterns[0].property, "text");
});

test("hover:bg-${palette}-100 keeps hover variant prefix", () => {
  const { patterns } = scanPalettePatternsFromSource(
    "const x = `hover:bg-${palette}-100`;",
    "t.ts",
  );
  assert.equal(patterns.length, 1);
  assert.equal(patterns[0].variantPrefix, "hover");
  assert.equal(patterns[0].property, "bg");
});

test("outline-${palette}-500 has empty variantPrefix (not outlin:)", () => {
  const { patterns } = scanPalettePatternsFromSource(
    "const x = `outline-${palette}-500`;",
    "t.ts",
  );
  assert.equal(patterns.length, 1);
  assert.equal(patterns[0].variantPrefix, "");
  assert.equal(patterns[0].property, "outline");
});

test("text-${palette}-${shade} dynamic shade has empty variantPrefix", () => {
  const { patterns } = scanPalettePatternsFromSource(
    "const x = `text-${palette}-${shade}`;",
    "t.ts",
  );
  assert.equal(patterns.length, 1);
  assert.equal(patterns[0].variantPrefix, "");
  assert.equal(patterns[0].property, "text");
  assert.equal(patterns[0].dynamicShade, true);
  assert.equal(patterns[0].shadeVar, "shade");
});
