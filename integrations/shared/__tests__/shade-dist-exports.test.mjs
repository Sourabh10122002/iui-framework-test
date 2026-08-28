import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "module";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "fs";
import { dirname, join } from "path";
import { spawnSync } from "child_process";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const frameworkRoot = join(__dirname, "../../..");
const requireFromHere = createRequire(join(frameworkRoot, "package.json"));
const runtimeNames = [
  "channel",
  "compose",
  "prefixInteractiveClasses",
  "shade",
  "slice",
  "stack",
];

test("built root and shade entries load through ESM and CJS conditions", async () => {
  for (const file of ["index.cjs", "index.esm.js", "shade.cjs", "shade.esm.js", "shade.d.ts"]) {
    assert.ok(existsSync(join(frameworkRoot, "dist", file)), `missing dist/${file}; run npm run build`);
  }

  const rootEsm = await import(pathToFileURL(join(frameworkRoot, "dist/index.esm.js")));
  const shadeEsm = await import(pathToFileURL(join(frameworkRoot, "dist/shade.esm.js")));
  const rootCjs = requireFromHere(join(frameworkRoot, "dist/index.cjs"));
  const shadeCjs = requireFromHere(join(frameworkRoot, "dist/shade.cjs"));

  assert.equal(typeof rootEsm.shade.compose, "function");
  assert.equal(typeof rootCjs.shade.compose, "function");
  assert.deepEqual(Object.keys(shadeEsm).sort(), runtimeNames);
  assert.deepEqual(Object.keys(shadeCjs).sort(), runtimeNames);
});

test("package shade export resolves and deep shade internals stay private", async () => {
  const esm = await import("@inventive-ui/framework/shade");
  const cjs = requireFromHere("@inventive-ui/framework/shade");
  assert.equal(typeof esm.compose, "function");
  assert.equal(typeof cjs.compose, "function");
  assert.throws(
    () => requireFromHere("@inventive-ui/framework/shade/core/dimensions"),
    (error) => error?.code === "ERR_PACKAGE_PATH_NOT_EXPORTED",
  );
});

test("shade declaration resolves for a consumer TypeScript program", () => {
  const root = mkdtempSync(join(frameworkRoot, ".shade-types-"));
  try {
    const source = join(root, "consumer.ts");
    writeFileSync(source, `
      import { compose, shade, type SemanticRequest } from "@inventive-ui/framework/shade";
      const request: SemanticRequest = {
        pattern: "interactive", variant: "solid", appearance: "strong",
        state: "default", channel: "full", palette: "brand",
        emit: { adaptive: true },
      };
      const a: string = compose(request);
      const b: string = shade.compose(request);
      void [a, b];
    `);
    // Spawn tsc via node (Windows cannot exec the .bin/tsc shim without a shell).
    const tscJs = join(frameworkRoot, "node_modules/typescript/lib/tsc.js");
    const result = spawnSync(
      process.execPath,
      [
        tscJs,
        "--noEmit",
        "--strict",
        "--skipLibCheck",
        "--module", "NodeNext",
        "--moduleResolution", "NodeNext",
        source,
      ],
      { cwd: frameworkRoot, encoding: "utf8" },
    );
    assert.equal(result.status, 0, result.stdout + result.stderr);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("browser shade bundle has no scanner, server, or Node builtin imports", () => {
  const source = readFileSync(join(frameworkRoot, "dist/shade.esm.js"), "utf8");
  assert.doesNotMatch(source, /scan-used-classes|load-shade-api|migration-tools|legacy-oracle/);
  assert.doesNotMatch(source, /(?:from|require\()\s*["'](?:node:)?(?:fs|path|module|url|crypto)["']/);
});
