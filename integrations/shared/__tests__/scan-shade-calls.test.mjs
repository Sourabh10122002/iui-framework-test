import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import {
  extractClassesFromSource,
  scanUsedClasses,
} from "../scan-used-classes.mjs";
import { loadShadeApi } from "../load-shade-api.mjs";

const api = loadShadeApi();
const tokens = (value) => new Set(value.split(/\s+/).filter(Boolean));
const assertContains = (actual, expected) => {
  for (const token of tokens(expected)) {
    assert.ok(actual.has(token), `missing shade token ${token}`);
  }
};

test("expands root facade, named aliases, namespace calls, and const aliases", () => {
  const source = `
    import { shade as semanticShade } from "@inventive-ui/framework";
    import { compose as tone, channel } from "@inventive-ui/framework/shade";
    import * as Shade from "@inventive-ui/framework/shade";

    const request = {
      pattern: "interactive",
      variant: "solid",
      appearance: "dualTone",
      state: "selected",
      channel: "full",
      palette: "brand",
      emit: { adaptive: true, scheme: "dark" },
    } as const;
    const composeAlias = tone;

    export const a = semanticShade.compose(request);
    export const b = composeAlias({
      pattern: "surface", variant: "outline", appearance: "soft",
      state: "disabled", palette: "neutral", emit: { adaptive: false, scheme: "light" },
    });
    export const c = Shade.stack({
      pattern: "interactive", variant: "ghost", appearance: "onColor",
      channel: "text", palette: "brand", emit: { adaptive: true },
    });
    export const d = channel({
      pattern: "field", variant: "underline", appearance: "strong",
      state: "focus", channel: "border", palette: "danger",
      emit: { adaptive: true },
    });
    export const e = Shade.slice({
      pattern: "interactive", variant: "solidUnderline", appearance: "strong",
      state: "pressed", channel: "full", palette: "brand",
      emit: { adaptive: true },
    });
  `;
  const actual = extractClassesFromSource(source, "ShadeUsage.tsx");

  assertContains(actual, api.compose({
    pattern: "interactive", variant: "solid", appearance: "dualTone",
    state: "selected", channel: "full", palette: "brand",
    emit: { adaptive: true, scheme: "dark" },
  }));
  assertContains(actual, api.compose({
    pattern: "surface", variant: "outline", appearance: "soft",
    state: "disabled", palette: "neutral",
    emit: { adaptive: false, scheme: "light" },
  }));
  assertContains(actual, api.stack({
    pattern: "interactive", variant: "ghost", appearance: "onColor",
    channel: "text", palette: "brand", emit: { adaptive: true },
  }));
  assertContains(actual, api.channel({
    pattern: "field", variant: "underline", appearance: "strong",
    state: "focus", channel: "border", palette: "danger",
    emit: { adaptive: true },
  }));
  assertContains(actual, api.slice({
    pattern: "interactive", variant: "solidUnderline", appearance: "strong",
    state: "pressed", channel: "full", palette: "brand",
    emit: { adaptive: true },
  }));
  assert.ok([...actual].some((token) => token.startsWith("dark:")));
  assert.ok([...actual].some((token) => token.startsWith("hover:")));
  assert.ok([...actual].some((token) => token.startsWith("active:")));
  assert.deepEqual(actual.diagnostics, []);
});

test("preserves transparent and underline semantic corrections exactly", () => {
  const source = `
    import { compose } from "@inventive-ui/framework/shade";
    compose({
      pattern: "interactive", variant: "transparent", appearance: "strong",
      state: "default", channel: "full", palette: "brand", emit: { adaptive: true },
    });
    compose({
      pattern: "interactive", variant: "underline", appearance: "strong",
      state: "hover", channel: "full", palette: "brand", emit: { adaptive: true },
    });
  `;
  const actual = extractClassesFromSource(source, "Corrections.ts");
  assertContains(actual, api.compose({
    pattern: "interactive", variant: "transparent", appearance: "strong",
    state: "default", channel: "full", palette: "brand", emit: { adaptive: true },
  }));
  assertContains(actual, api.compose({
    pattern: "interactive", variant: "underline", appearance: "strong",
    state: "hover", channel: "full", palette: "brand", emit: { adaptive: true },
  }));
});

test("ignores unrelated compose functions", () => {
  const actual = extractClassesFromSource(`
    const compose = (value) => value;
    compose({ variant: "outline", palette: "brand" });
  `, "Unrelated.ts");
  assert.equal(actual.diagnostics.length, 0);
});

test("diagnoses dynamic shade calls without guessing request classes", () => {
  const source = `
    import { compose } from "@inventive-ui/framework/shade";
    const base = { pattern: "interactive", variant: "outline" };
    let mutable = "brand";
    compose({ ...base, appearance: "strong", state: "default", palette: "brand" });
    compose({ ["pattern"]: "interactive", variant: "solid", appearance: "strong", state: "default", palette: "brand" });
    compose({ pattern: "interactive", variant: \`solid-\${mutable}\`, appearance: "strong", state: "default", palette: "brand" });
    compose({ pattern: "interactive", variant: "solid", appearance: "strong", state: "default", palette: mutable });
    compose(makeRequest());
  `;
  const actual = extractClassesFromSource(source, "Dynamic.ts");
  assert.deepEqual(
    actual.diagnostics.map(({ code, reason }) => [code, reason]),
    [
      ["IUI_SHADE_DYNAMIC", "object spread"],
      ["IUI_SHADE_DYNAMIC", "computed object key"],
      ["IUI_SHADE_DYNAMIC", "template expression"],
      ["IUI_SHADE_DYNAMIC", 'runtime or mutable identifier "mutable"'],
      ["IUI_SHADE_DYNAMIC", "function call"],
    ],
  );
  assert.equal(actual.has("outline"), false);
  assert.equal(actual.has("bg-brand-500"), false);
  for (const diagnostic of actual.diagnostics) {
    assert.match(diagnostic.message, /static generated map\/finite literal domain/);
    assert.match(diagnostic.message, /includeShadeMatrix/);
  }
});

test("scan diagnostics are deterministic and strict mode is opt-in", () => {
  const root = mkdtempSync(join(tmpdir(), "iui-shade-diagnostics-"));
  mkdirSync(join(root, "src"));
  writeFileSync(join(root, "src", "b.ts"), `
    import { compose } from "@inventive-ui/framework/shade";
    export const utilityB = "text-sm";
    compose(runtimeRequest);
  `);
  writeFileSync(join(root, "src", "a.ts"), `
    import { shade } from "@inventive-ui/framework";
    export const utilityA = "flex";
    shade.compose({ ...runtimeRequest });
  `);
  try {
    const result = scanUsedClasses(root, {
      scanDirs: ["src"],
      scanPackages: [],
      shadeDiagnostics: "silent",
    });
    assert.deepEqual(
      result.diagnostics.map(({ filename }) => filename),
      [...result.diagnostics.map(({ filename }) => filename)].sort(),
    );
    assert.deepEqual([...result.classes], [...result.classes].sort());
    assert.throws(
      () => scanUsedClasses(root, {
        scanDirs: ["src"],
        scanPackages: [],
        shadeDiagnostics: "error",
      }),
      /IUI shade scan.*includeShadeMatrix/s,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
