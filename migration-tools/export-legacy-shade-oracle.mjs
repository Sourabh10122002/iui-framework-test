#!/usr/bin/env node
/**
 * One-time / re-freeze exporter for the Framework-owned legacy shade oracle.
 *
 * NOT part of the published package (outside package.json "files"; never import from src).
 *
 * Usage:
 *   LEGACY_SHADE_ROOT=/path/to/Design-System \
 *   APPROVED_PROVENANCE=/path/to/legacy-shade-provenance.json \
 *   node migration-tools/export-legacy-shade-oracle.mjs [--from-snapshot] [--out <dir>]
 *
 * Modes:
 *   --from-snapshot  (default / G0 fallback) Parse DS canonical-matrix golden snapshot.
 *   Live compose via LEGACY_SHADE_ROOT TypeScript is reserved for a future re-freeze when a
 *   DS-isolated runner is available; this tool still enforces provenance hash gates first.
 *
 * Decision refs: SD-001 (DS oracle), SD-004 (exact class string contract).
 */

import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const TOOL = "export-legacy-shade-oracle.mjs";
const TOOL_VERSION = "1.0.0-g0";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FW_ROOT = path.resolve(__dirname, "..");
const DEFAULT_PROVENANCE = path.join(
  FW_ROOT,
  "src/utilities/shade/migration/legacy-shade-provenance.json",
);
const DEFAULT_OUT = path.join(
  FW_ROOT,
  "src/utilities/shade/tests/fixtures/legacy-oracle",
);

function sha256(buf) {
  return createHash("sha256").update(buf).digest("hex");
}
function sha256File(p) {
  return sha256(fs.readFileSync(p));
}
function setNorm(classes) {
  return classes.split(/\s+/).filter(Boolean).sort().join(" ");
}
function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === ".DS_Store") continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

function parseArgs(argv) {
  const args = { fromSnapshot: true, out: DEFAULT_OUT, provenance: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--from-snapshot") args.fromSnapshot = true;
    else if (a === "--live") args.fromSnapshot = false;
    else if (a === "--out") args.out = path.resolve(argv[++i]);
    else if (a === "--provenance") args.provenance = path.resolve(argv[++i]);
    else if (a === "--help" || a === "-h") args.help = true;
  }
  return args;
}

function loadProvenance(provenancePath) {
  if (!fs.existsSync(provenancePath)) {
    throw new Error(`Missing approved provenance manifest: ${provenancePath}`);
  }
  return JSON.parse(fs.readFileSync(provenancePath, "utf8"));
}

function assertSourceHashes(legacyRoot, provenance) {
  const approved = new Map(
    (provenance.hashedFiles || []).map((f) => [f.path, f.sha256]),
  );
  if (approved.size === 0) {
    throw new Error("Provenance manifest has no hashedFiles entries");
  }

  const mismatches = [];
  const missing = [];
  for (const [rel, expected] of approved) {
    const abs = path.join(legacyRoot, rel);
    if (!fs.existsSync(abs)) {
      missing.push(rel);
      continue;
    }
    const actual = sha256File(abs);
    if (actual !== expected) {
      mismatches.push({ path: rel, expected, actual });
    }
  }

  if (missing.length || mismatches.length) {
    const detail = {
      missing,
      mismatches: mismatches.slice(0, 20),
      mismatchCount: mismatches.length,
    };
    throw new Error(
      `LEGACY_SHADE_ROOT hashes differ from approved provenance (SD-001 freeze).\n${JSON.stringify(detail, null, 2)}`,
    );
  }
}

function parseGoldenSnapshot(snapPath) {
  const text = fs.readFileSync(snapPath, "utf8");
  const rows = [];
  const objRe =
    /\{\s*"classes": "((?:\\.|[^"\\])*)",\s*"key": "([^"]+)",?\s*\}/g;
  let m;
  while ((m = objRe.exec(text))) {
    rows.push({
      classes: JSON.parse(`"${m[1]}"`),
      key: m[2],
    });
  }
  if (rows.length === 0) {
    throw new Error(`Failed to parse golden snapshot: ${snapPath}`);
  }
  return rows;
}

function emitModeOf(key) {
  const e = key.split("|").pop();
  if (e === "adaptive") return "adaptive";
  if (e === "scheme-light") return "light-only";
  if (e === "scheme-dark") return "dark-only";
  return e;
}

function writeFixtures({ outDir, rows, provenance, provenancePath, generationPath, generationNote }) {
  fs.mkdirSync(outDir, { recursive: true });
  const provenanceSha256 = sha256File(provenancePath);
  const byMode = { adaptive: [], "light-only": [], "dark-only": [] };

  for (const r of rows) {
    const mode = emitModeOf(r.key);
    if (!byMode[mode]) continue;
    byMode[mode].push({
      key: r.key,
      classesExact: r.classes,
      classesSetNormalized: setNorm(r.classes),
    });
  }

  const chunkHashes = {};
  const modeFiles = {};
  for (const [mode, modeRows] of Object.entries(byMode)) {
    const payload = {
      schemaVersion: 1,
      tool: TOOL,
      toolVersion: TOOL_VERSION,
      generationPath,
      generationNote,
      provenanceManifest: path.relative(FW_ROOT, provenancePath).replace(/\\/g, "/"),
      provenanceSha256,
      decisionRefs: ["SD-001", "SD-004"],
      emissionMode: mode,
      rowCount: modeRows.length,
      rows: modeRows,
    };
    const file = `classes-${mode}.json`;
    const json = `${JSON.stringify(payload)}\n`;
    fs.writeFileSync(path.join(outDir, file), json);
    chunkHashes[mode] = sha256(json);
    modeFiles[mode] = file;
  }

  const approvedSourceHashes = Object.fromEntries(
    (provenance.hashedFiles || []).map((f) => [f.path, f.sha256]),
  );

  const manifest = {
    schemaVersion: 1,
    tool: TOOL,
    toolVersion: TOOL_VERSION,
    generationPath,
    generationNote,
    timestamp: new Date().toISOString(),
    provenanceManifest: path.relative(FW_ROOT, provenancePath).replace(/\\/g, "/"),
    provenanceSha256,
    approvedSourceHashes,
    dsGitHead: provenance.designSystem?.gitHead ?? null,
    decisionRefs: ["SD-001", "SD-003", "SD-004"],
    contract: "exact-class-string-order-and-membership",
    emissionModes: modeFiles,
    chunkHashes,
    aggregateHash: sha256(Object.values(chunkHashes).sort().join("\n")),
    rowCounts: Object.fromEntries(
      Object.entries(byMode).map(([k, v]) => [k, v.length]),
    ),
    totalRows: rows.length,
    uniqueKeys: new Set(rows.map((r) => r.key)).size,
    errorsFixture: "errors.json",
    shimsFixture: "public-shims.json",
    diagnosticsNote:
      "classesSetNormalized fields are diagnostics only; harness asserts classesExact (SD-004).",
  };

  fs.writeFileSync(
    path.join(outDir, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  fs.writeFileSync(
    path.join(outDir, "errors.json"),
    `${JSON.stringify(
      {
        schemaVersion: 1,
        tool: TOOL,
        toolVersion: TOOL_VERSION,
        generationPath,
        provenanceManifest: manifest.provenanceManifest,
        provenanceSha256,
        cases: [],
        note: "Invalid-request corpus is empty for snapshot fallback; populate via --live re-freeze.",
      },
      null,
      2,
    )}\n`,
  );
  fs.writeFileSync(
    path.join(outDir, "public-shims.json"),
    `${JSON.stringify(
      {
        schemaVersion: 1,
        tool: TOOL,
        toolVersion: TOOL_VERSION,
        generationPath,
        provenanceManifest: manifest.provenanceManifest,
        provenanceSha256,
        samples: [],
        note: "Shim corpus deferred to live exporter re-freeze; composeSemantic oracle is authoritative for G0.",
      },
      null,
      2,
    )}\n`,
  );

  return manifest;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(`Usage: LEGACY_SHADE_ROOT=<ds-root> node ${TOOL} [--from-snapshot|--live] [--out dir] [--provenance file]`);
    process.exit(0);
  }

  const legacyRoot = process.env.LEGACY_SHADE_ROOT;
  if (!legacyRoot) {
    console.error("LEGACY_SHADE_ROOT is required (Design-System checkout path).");
    process.exit(1);
  }
  if (!fs.existsSync(legacyRoot)) {
    console.error(`LEGACY_SHADE_ROOT does not exist: ${legacyRoot}`);
    process.exit(1);
  }

  const provenancePath =
    args.provenance ||
    process.env.APPROVED_PROVENANCE ||
    DEFAULT_PROVENANCE;
  const provenance = loadProvenance(provenancePath);

  console.error(`[${TOOL}] verifying source hashes against provenance…`);
  assertSourceHashes(legacyRoot, provenance);

  if (!args.fromSnapshot) {
    console.error(
      `[${TOOL}] --live compose export is not implemented in G0 (no DS-isolated runner). Use --from-snapshot.`,
    );
    process.exit(2);
  }

  const snapRel =
    provenance.canonicalMatrix?.dsSnapshot?.path ||
    "src/utilities/shade/tests/__snapshots__/canonical-matrix.golden.test.ts.snap";
  const snapPath = path.join(legacyRoot, snapRel);
  if (!fs.existsSync(snapPath)) {
    console.error(`DS golden snapshot missing: ${snapPath}`);
    process.exit(1);
  }

  const expectedSnapSha = provenance.canonicalMatrix?.dsSnapshot?.sha256;
  const actualSnapSha = sha256File(snapPath);
  if (expectedSnapSha && actualSnapSha !== expectedSnapSha) {
    console.error(
      `DS snapshot hash drift.\n expected: ${expectedSnapSha}\n actual:   ${actualSnapSha}`,
    );
    process.exit(1);
  }

  console.error(`[${TOOL}] parsing snapshot fallback oracle…`);
  const rows = parseGoldenSnapshot(snapPath);
  const manifest = writeFixtures({
    outDir: args.out,
    rows,
    provenance,
    provenancePath,
    generationPath: "ds-snapshot-fallback",
    generationNote:
      "Fixtures derived from DS canonical-matrix golden snapshot (SD-001 oracle). Live compose path gated behind --live (not implemented in G0).",
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        tool: TOOL,
        toolVersion: TOOL_VERSION,
        generationPath: manifest.generationPath,
        out: args.out,
        totalRows: manifest.totalRows,
        uniqueKeys: manifest.uniqueKeys,
        aggregateHash: manifest.aggregateHash,
        provenanceSha256: manifest.provenanceSha256,
      },
      null,
      2,
    ),
  );
}

main();
