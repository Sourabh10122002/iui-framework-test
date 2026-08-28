/**
 * Stage D — SSR / runtime safety for shade + compile-first CSS.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "module";
import { readFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { pathToFileURL, fileURLToPath } from "url";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

const __dirname = dirname(fileURLToPath(import.meta.url));
const frameworkRoot = join(__dirname, "../../..");
const requireFromHere = createRequire(join(frameworkRoot, "package.json"));

const REQUEST = {
  pattern: "interactive",
  variant: "solid",
  appearance: "strong",
  state: "default",
  channel: "full",
  palette: "brand",
  emit: { adaptive: true },
};

function assertNoDomGlobals() {
  assert.equal(typeof globalThis.window, "undefined");
  assert.equal(typeof globalThis.document, "undefined");
}

test("root, /shade, /server, and node build API import without window/document", async () => {
  const prevWindow = globalThis.window;
  const prevDocument = globalThis.document;
  try {
    delete globalThis.window;
    delete globalThis.document;
    assertNoDomGlobals();

    for (const file of [
      "dist/index.esm.js",
      "dist/shade.esm.js",
      "dist/server/index.esm.js",
      "dist/node/build-css-api.mjs",
    ]) {
      assert.ok(existsSync(join(frameworkRoot, file)), `missing ${file}; run npm run build`);
    }

    const root = await import(pathToFileURL(join(frameworkRoot, "dist/index.esm.js")).href);
    const shade = await import(pathToFileURL(join(frameworkRoot, "dist/shade.esm.js")).href);
    const server = await import(
      pathToFileURL(join(frameworkRoot, "dist/server/index.esm.js")).href
    );
    const buildApi = await import(
      pathToFileURL(join(frameworkRoot, "dist/node/build-css-api.mjs")).href
    );

    assert.equal(typeof root.shade?.compose, "function");
    assert.equal(typeof shade.compose, "function");
    assert.equal(typeof server.generateCriticalCSS, "function");
    assert.equal(typeof server.createSSRRegistry, "function");
    assert.equal(typeof buildApi.generateBuildCSS, "function");
    assertNoDomGlobals();
  } finally {
    if (prevWindow !== undefined) globalThis.window = prevWindow;
    else delete globalThis.window;
    if (prevDocument !== undefined) globalThis.document = prevDocument;
    else delete globalThis.document;
  }
});

const SSR_CONFIG = {
  theme: {
    colors: {
      brand: { set: "#6366f1" },
      semantic: { success: "#22c55e", warning: "#f59e0b", danger: "#ef4444", info: "#3b82f6" },
      neutral: { base: "gray" },
    },
  },
};

test("renderToString fixture: shade classes covered by critical CSS", async () => {
  const shade = await import(pathToFileURL(join(frameworkRoot, "dist/shade.esm.js")).href);
  const server = await import(
    pathToFileURL(join(frameworkRoot, "dist/server/index.esm.js")).href
  );

  const classes = shade.compose(REQUEST);
  assert.ok(classes.trim().length > 0, "compose must emit classes");

  const html = renderToString(
    createElement("button", { className: classes, type: "button" }, "Save"),
  );
  assert.match(html, /class="/);

  const tokens = classes.split(/\s+/).filter(Boolean);
  for (const token of tokens) {
    assert.ok(html.includes(token), `SSR HTML missing class token: ${token}`);
  }

  const critical = server.generateCriticalCSSWithMeta(tokens, SSR_CONFIG);
  assert.ok(critical.css.length > 0, "critical CSS must be non-empty");
  assert.equal(
    critical.uncoveredClasses.length,
    0,
    `uncovered classes: ${critical.uncoveredClasses.join(", ")}`,
  );
  for (const token of tokens) {
    // Engine may emit escaped selectors; require each utility stem appears.
    const stem = token.replace(/^dark:/, "").replace(/:/g, "\\:");
    assert.ok(
      critical.css.includes(token) ||
        critical.css.includes(stem) ||
        critical.builtClasses.includes(token),
      `critical CSS missing coverage for ${token}`,
    );
  }
});

test("concurrent light/dark SSR registries do not leak mutable state", async () => {
  const server = await import(
    pathToFileURL(join(frameworkRoot, "dist/server/index.esm.js")).href
  );
  const shade = await import(pathToFileURL(join(frameworkRoot, "dist/shade.esm.js")).href);

  const lightOnly = shade
    .compose({ ...REQUEST, emit: { adaptive: false } })
    .split(/\s+/)
    .filter(Boolean);
  const adaptive = shade.compose(REQUEST).split(/\s+/).filter(Boolean);

  const lightReg = server.createSSRRegistry();
  const darkReg = server.createSSRRegistry();

  await Promise.all([
    Promise.resolve().then(() => {
      lightReg.add(...lightOnly);
      lightReg.add("text-sm", "bg-brand-500");
    }),
    Promise.resolve().then(() => {
      darkReg.add(...adaptive.filter((c) => c.startsWith("dark:")));
      darkReg.add("dark:bg-brand-400", "dark:text-white");
    }),
  ]);

  const lightClasses = lightReg.getClasses().sort();
  const darkClasses = darkReg.getClasses().sort();

  assert.ok(lightClasses.length > 0);
  assert.ok(darkClasses.length > 0);
  assert.notDeepEqual(lightClasses, darkClasses);

  for (const cls of lightClasses) {
    if (cls.startsWith("dark:")) {
      assert.fail(`light registry leaked dark class: ${cls}`);
    }
  }

  const lightCss = lightReg.getCSS(SSR_CONFIG);
  const darkCss = darkReg.getCSS(SSR_CONFIG);
  assert.ok(lightCss.length > 0);
  assert.ok(darkCss.length > 0);

  // Mutating one registry after CSS generation must not rewrite the other.
  lightReg.add("flex");
  lightReg.clear();
  assert.deepEqual(darkReg.getClasses().sort(), darkClasses);
  assert.equal(darkReg.getCSS(SSR_CONFIG), darkCss);
});

test("hydration class-string equality: SSR composition === client composition", async () => {
  const shadeEsm = await import(pathToFileURL(join(frameworkRoot, "dist/shade.esm.js")).href);
  const shadeCjs = requireFromHere(join(frameworkRoot, "dist/shade.cjs"));
  const rootEsm = await import(pathToFileURL(join(frameworkRoot, "dist/index.esm.js")).href);

  const ssr = shadeEsm.compose(REQUEST);
  const clientNamed = shadeEsm.compose(REQUEST);
  const clientRoot = rootEsm.shade.compose(REQUEST);
  const clientCjs = shadeCjs.compose(REQUEST);
  const stacked = shadeEsm.stack({
    pattern: "interactive",
    variant: "solid",
    appearance: "strong",
    channel: "full",
    palette: "brand",
    emit: { adaptive: true },
  });

  assert.equal(ssr, clientNamed);
  assert.equal(ssr, clientRoot);
  assert.equal(ssr, clientCjs);
  assert.ok(stacked.includes(ssr.split(/\s+/)[0]));

  const html = renderToString(
    createElement("div", { className: ssr }, "hydrate-me"),
  );
  const match = html.match(/class="([^"]*)"/);
  assert.ok(match);
  assert.equal(match[1], ssr);
});

test("browser shade/root bundles exclude server CSS engine; shade stays DOM-free", () => {
  const shade = readFileSync(join(frameworkRoot, "dist/shade.esm.js"), "utf8");
  const root = readFileSync(join(frameworkRoot, "dist/index.esm.js"), "utf8");
  const server = readFileSync(join(frameworkRoot, "dist/server/index.esm.js"), "utf8");

  for (const [label, source] of [
    ["shade", shade],
    ["root", root],
  ]) {
    assert.doesNotMatch(
      source,
      /generateCriticalCSS|createSSRRegistry|generateBuildCSS|expandShadeClasses/,
      `${label} must not embed SSR CSS APIs`,
    );
  }

  // Dedicated shade entry must remain browser-safe without DOM engine hooks.
  assert.doesNotMatch(
    shade,
    /(?:document|window)\.(?:createElement|querySelector|getElementById)/,
    "shade must not call DOM APIs",
  );
  assert.doesNotMatch(shade, /utilityBuilder|generateOptimizedCSS/);

  assert.match(server, /generateCriticalCSS/);
  assert.match(server, /createSSRRegistry/);
  // Server entry is Node-oriented; browser shade stays tiny relative to it.
  assert.ok(server.length > shade.length * 5);
});
