import fs from "node:fs";
import path from "node:path";
import { composeSemantic } from "../core/composer";
import { CANONICAL_MATRIX } from "../fixtures/canonical-matrix";

type OracleRow = { key: string; classesExact: string };
type OracleFile = { rows: OracleRow[]; provenanceSha256?: string; emissionMode?: string };
type AllowlistEntry = {
  id: string;
  status: string;
  match: {
    palette?: string;
    channel?: string;
    patterns?: string[];
    variants?: string[];
    scopes?: Array<{ pattern: string; channels: string[] }>;
  };
};
type UnexplainedEntry = {
  key: string;
  oracleExact: string;
  frameworkExact: string;
};

const migrationDir = path.join(__dirname, "..", "migration");
const oracleDir = path.join(__dirname, "fixtures", "legacy-oracle");

const keyOf = (entry: (typeof CANONICAL_MATRIX)[number]) => {
  const req = entry.request;
  const emitKey = req.emit?.adaptive
    ? "adaptive"
    : `scheme-${req.emit?.scheme ?? "light"}`;
  return [
    req.pattern,
    req.variant,
    req.appearance,
    req.state,
    req.channel,
    req.palette,
    emitKey,
  ].join("|");
};

const loadJson = <T>(filePath: string): T =>
  JSON.parse(fs.readFileSync(filePath, "utf8")) as T;

const parseKey = (key: string) => {
  const [pattern, variant, appearance, state, channel, palette, emitKey] =
    key.split("|");
  return { pattern, variant, appearance, state, channel, palette, emitKey };
};

const matchesAllowlist = (
  key: string,
  entries: AllowlistEntry[],
): AllowlistEntry | undefined => {
  const parts = parseKey(key);
  return entries.find((entry) => {
    if (entry.status !== "planned" && entry.status !== "active") return false;
    const m = entry.match;
    if (m.palette && m.palette !== parts.palette) return false;
    if (m.channel && m.channel !== parts.channel) return false;
    if (m.patterns && !m.patterns.includes(parts.pattern)) return false;
    if (m.variants && !m.variants.includes(parts.variant)) return false;
    if (
      m.scopes &&
      !m.scopes.some(
        (scope) =>
          scope.pattern === parts.pattern &&
          scope.channels.includes(parts.channel),
      )
    ) {
      return false;
    }
    // DEV-* are planned future corrections — they do NOT auto-pass current mismatches
    // unless status is "active". Planned entries are documented only.
    return entry.status === "active";
  });
};

describe("legacy shade parity harness (G0)", () => {
  const manifest = loadJson<{
    totalRows: number;
    uniqueKeys: number;
    emissionModes: Record<string, string>;
    aggregateHash: string;
    provenanceSha256: string;
    generationPath: string;
    contract: string;
  }>(path.join(oracleDir, "manifest.json"));

  const allowlist = loadJson<{ entries: AllowlistEntry[] }>(
    path.join(migrationDir, "intentional-deviation-allowlist.json"),
  );

  const unexplainedInv = loadJson<{
    count: number;
    inventorySha256: string;
    entries: UnexplainedEntry[];
  }>(path.join(migrationDir, "expected-unexplained-diffs.json"));

  const oracleByKey = new Map<string, string>();
  for (const file of Object.values(manifest.emissionModes)) {
    const payload = loadJson<OracleFile>(path.join(oracleDir, file));
    for (const row of payload.rows) {
      if (!oracleByKey.has(row.key)) {
        oracleByKey.set(row.key, row.classesExact);
      }
    }
  }

  const unexplainedByKey = new Map(
    unexplainedInv.entries.map((e) => [e.key, e] as const),
  );

  it("oracle manifest metadata is present (SD-001 / SD-004)", () => {
    expect(manifest.contract).toBe("exact-class-string-order-and-membership");
    expect(manifest.generationPath).toBe("ds-snapshot-fallback");
    expect(manifest.totalRows).toBe(142080);
    expect(manifest.uniqueKeys).toBe(106560);
    expect(manifest.provenanceSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(oracleByKey.size).toBe(106560);
  });

  it("allowlist records DEV-001 and DEV-002 as active (SD-002)", () => {
    const ids = allowlist.entries.map((e) => e.id).sort();
    expect(ids).toEqual(["DEV-001", "DEV-002"]);
    expect(allowlist.entries.every((e) => e.status === "active")).toBe(true);
  });

  it("composeSemantic matches oracle byte-for-byte, else allowlist/active, else tracked unexplained inventory", () => {
    // Unique keys only — adaptive rows are duplicated in CANONICAL_MATRIX.
    const uniqueRequests = new Map<string, (typeof CANONICAL_MATRIX)[number]>();
    for (const entry of CANONICAL_MATRIX) {
      const key = keyOf(entry);
      if (!uniqueRequests.has(key)) uniqueRequests.set(key, entry);
    }

    const missingOracleRequests = [...oracleByKey.keys()].filter(
      (key) => !uniqueRequests.has(key),
    );
    expect(missingOracleRequests).toEqual([]);

    const matched: string[] = [];
    const allowlisted: Array<{ key: string; id: string }> = [];
    const trackedUnexplained: string[] = [];
    const novel: Array<{
      key: string;
      oracle: string | undefined;
      actual: string;
      expectedUnexplained?: UnexplainedEntry;
    }> = [];
    const staleUnexplained: string[] = [];

    for (const [key, entry] of uniqueRequests) {
      const oracle = oracleByKey.get(key);
      const actual = composeSemantic(entry.request);

      if (oracle === actual) {
        matched.push(key);
        // If inventory still lists this key, it is stale (parity achieved).
        if (unexplainedByKey.has(key)) staleUnexplained.push(key);
        continue;
      }

      const allowed = matchesAllowlist(key, allowlist.entries);
      if (allowed) {
        allowlisted.push({ key, id: allowed.id });
        continue;
      }

      const tracked = unexplainedByKey.get(key);
      if (
        tracked &&
        tracked.oracleExact === oracle &&
        tracked.frameworkExact === actual
      ) {
        trackedUnexplained.push(key);
        continue;
      }

      novel.push({ key, oracle, actual, expectedUnexplained: tracked });
    }

    // Inventory keys must all be observed as tracked unexplained (no missing).
    const missingFromRun = [...unexplainedByKey.keys()].filter(
      (k) => !trackedUnexplained.includes(k) && !staleUnexplained.includes(k),
    );

    if (novel.length || staleUnexplained.length || missingFromRun.length) {
      const sample = novel.slice(0, 10);
      // eslint-disable-next-line no-console
      console.error(
        JSON.stringify(
          {
            matched: matched.length,
            allowlisted: allowlisted.length,
            trackedUnexplained: trackedUnexplained.length,
            novelCount: novel.length,
            staleUnexplainedCount: staleUnexplained.length,
            missingFromRunCount: missingFromRun.length,
            novelSample: sample,
            staleSample: staleUnexplained.slice(0, 5),
            missingSample: missingFromRun.slice(0, 5),
          },
          null,
          2,
        ),
      );
    }

    expect(novel).toEqual([]);
    expect(staleUnexplained).toEqual([]);
    expect(missingFromRun).toEqual([]);
    expect(trackedUnexplained.length).toBe(unexplainedInv.count);
    expect(matched.length + trackedUnexplained.length + allowlisted.length).toBe(
      uniqueRequests.size,
    );
    expect(new Set(allowlisted.map(({ id }) => id))).toEqual(
      new Set(["DEV-001", "DEV-002"]),
    );
    expect(
      allowlisted.filter(({ key }) => oracleByKey.has(key)).length,
    ).toBe(1933);
    expect(
      allowlisted.filter(({ key }) => !oracleByKey.has(key)).length,
    ).toBe(2880);
    expect(
      Object.fromEntries(
        ["DEV-001", "DEV-002"].map((id) => [
          id,
          allowlisted.filter((entry) => entry.id === id).length,
        ]),
      ),
    ).toEqual({ "DEV-001": 2221, "DEV-002": 2592 });
  });
});
