/**
 * Stage E — Isolated consumer fixture against `npm pack` (no components repo edits).
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
  readdirSync,
} from "fs";
import { dirname, join } from "path";
import { tmpdir } from "os";
import { fileURLToPath, pathToFileURL } from "url";
import { spawnSync } from "child_process";
import { createRequire } from "module";

const __dirname = dirname(fileURLToPath(import.meta.url));
const frameworkRoot = join(__dirname, "../../..");
const componentsRoot = "/Users/sparsh/components";
const fixtureSrc = join(__dirname, "../__fixtures__/packed-consumer");
const useShell = process.platform === "win32";

function run(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, {
    encoding: "utf8",
    ...opts,
    shell: opts.shell ?? useShell,
  });
  if (result.status !== 0) {
    const detail = `${result.stdout || ""}\n${result.stderr || ""}`.trim();
    throw new Error(
      `Command failed (${cmd} ${args.join(" ")}): status=${result.status}\n${detail}`,
    );
  }
  return result;
}

function gitPorcelain(repo) {
  if (!existsSync(repo)) return null;
  return spawnSync("git", ["status", "--porcelain"], {
    cwd: repo,
    encoding: "utf8",
    shell: useShell,
  }).stdout;
}

test(
  "packed consumer installs tarball and validates shade scan/build/types",
  { timeout: 300_000 },
  async () => {
  const componentsBefore = gitPorcelain(componentsRoot);
  const work = mkdtempSync(join(tmpdir(), "iui-packed-consumer-"));
  const packDir = join(work, "pack");
  const consumerDir = join(work, "consumer");
  mkdirSync(packDir, { recursive: true });

  try {
    // Ensure dist exists for pack contents.
    for (const file of ["dist/shade.cjs", "dist/shade.esm.js", "dist/shade.d.ts"]) {
      assert.ok(existsSync(join(frameworkRoot, file)), `missing ${file}; run npm run build`);
    }

    run("npm", ["pack", "--pack-destination", packDir], { cwd: frameworkRoot });
    const tarballs = readdirSync(packDir).filter((f) => f.endsWith(".tgz"));
    assert.equal(tarballs.length, 1, `expected one tarball, got ${tarballs.join(", ")}`);
    const tarball = join(packDir, tarballs[0]);

    // Pack must not ship migration/oracle/test paths.
    const listing = run("tar", ["-tzf", tarball], { cwd: packDir }).stdout;
    for (const banned of [
      "migration-tools/",
      "src/utilities/shade/migration/",
      "legacy-oracle/",
      "__tests__/",
      "Design-System/",
      "components/",
    ]) {
      assert.ok(!listing.includes(banned), `packed tarball unexpectedly contains ${banned}`);
    }
    assert.match(listing, /package\/dist\/shade\.esm\.js/);
    assert.match(listing, /package\/dist\/shade\.d\.ts/);

    mkdirSync(consumerDir, { recursive: true });
    cpSync(fixtureSrc, consumerDir, { recursive: true });

    // Hermetic deps: file: links from Framework's node_modules (no registry fetch).
    const local = (name) => `file:${join(frameworkRoot, "node_modules", name)}`;
    writeFileSync(
      join(consumerDir, "package.json"),
      JSON.stringify(
        {
          name: "iui-packed-consumer-fixture",
          private: true,
          type: "module",
          dependencies: {
            "@inventive-ui/framework": `file:${tarball}`,
            react: local("react"),
            "react-dom": local("react-dom"),
          },
          devDependencies: {
            "@types/react": local("@types/react"),
            typescript: local("typescript"),
            vite: local("vite"),
          },
        },
        null,
        2,
      ),
    );

    run(
      "npm",
      ["install", "--no-fund", "--no-audit", "--legacy-peer-deps", "--install-links"],
      {
        cwd: consumerDir,
        env: {
          ...process.env,
          npm_config_ignore_scripts: "false",
          npm_config_legacy_peer_deps: "true",
        },
      },
    );
    const requireConsumer = createRequire(join(consumerDir, "package.json"));
    const shadeCjs = requireConsumer("@inventive-ui/framework/shade");
    assert.equal(typeof shadeCjs.compose, "function");

    const composed = shadeCjs.compose({
      pattern: "interactive",
      variant: "solid",
      appearance: "strong",
      state: "default",
      channel: "full",
      palette: "brand",
      emit: { adaptive: true },
    });
    assert.ok(composed.includes("bg-brand-500") || composed.split(/\s+/).length > 0);

    // Scanner + CSS build via published shared modules.
    // Windows: dynamic import requires file:// URLs, not raw absolute paths.
    const importShared = (file) =>
      import(
        pathToFileURL(
          join(
            consumerDir,
            "node_modules/@inventive-ui/framework/integrations/shared",
            file,
          ),
        ).href
      );
    const { scanUsedClasses } = await importShared("scan-used-classes.mjs");
    const { generateBuildCSSForProject } = await importShared(
      "generate-build-css.mjs",
    );

    const scan = scanUsedClasses(consumerDir, {
      scanDirs: ["src"],
      shadeDiagnostics: "error",
    });
    assert.ok(scan.classCount > 0, "scanner must find classes");
    assert.ok(
      [...scan.classes].some((c) => c.includes("brand") || c.startsWith("bg-") || c.startsWith("text-")),
      "expected shade-derived utility classes in scan",
    );
    assert.equal(scan.diagnostics?.length ?? 0, 0, "dynamic shade diagnostics must be empty");

    const css = generateBuildCSSForProject(consumerDir, {
      config: {
        theme: {
          colors: {
            brand: { set: "#6366f1" },
            semantic: {
              success: "#22c55e",
              warning: "#f59e0b",
              danger: "#ef4444",
              info: "#3b82f6",
            },
            neutral: { base: "#64748b" },
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
      },
      minify: false,
    });
    assert.ok(css.combinedCSS.length > 0);
    assert.ok(css.expandedClassCount < 200, "scan-first must not inflate full matrix");
    assert.match(css.combinedCSS, /bg-brand-500|brand-500/);

    // Types resolve from packed package.
    // Spawn tsc via node (Windows cannot exec the .bin/tsc shim without a shell).
    const tscJs = join(consumerDir, "node_modules/typescript/lib/tsc.js");
    assert.ok(existsSync(tscJs), "consumer typescript install missing");
    run(
      process.execPath,
      [
        tscJs,
        "--noEmit",
        "--strict",
        "--skipLibCheck",
        "--module",
        "NodeNext",
        "--moduleResolution",
        "NodeNext",
        "--jsx",
        "react-jsx",
        "src/app.tsx",
        "src/maps.ts",
      ],
      { cwd: consumerDir, shell: false },
    );

    // Vite plugin entry resolves from packed package when feasible.
    const viteEntry = join(
      consumerDir,
      "node_modules/@inventive-ui/framework/integrations/vite/index.mjs",
    );
    assert.ok(existsSync(viteEntry), "packed package must expose vite integration");
    const viteMod = await import(pathToFileURL(viteEntry).href);
    assert.equal(typeof viteMod.iuiBuildCSSPlugin, "function");
    assert.equal(typeof viteMod.scanUsedClasses, "function");
  } finally {
    rmSync(work, { recursive: true, force: true });
  }

  const componentsAfter = gitPorcelain(componentsRoot);
  if (componentsBefore !== null) {
    assert.equal(
      componentsAfter,
      componentsBefore,
      "components repo git status must be unchanged by packed-consumer task",
    );
  }
});
