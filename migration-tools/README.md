# Framework shade migration tools

One-shot / re-freeze utilities for the shade-system migration. **Not published.**

| Tool | Purpose |
|---|---|
| [`export-legacy-shade-oracle.mjs`](./export-legacy-shade-oracle.mjs) | Build Framework-owned oracle fixtures from an approved DS freeze |

## Rules

- Never import these modules from `src/` or Rollup entrypoints.
- Exporter fails if `LEGACY_SHADE_ROOT` file hashes differ from [`legacy-shade-provenance.json`](../src/utilities/shade/migration/legacy-shade-provenance.json).
- Primary navigation: [`../src/utilities/shade/migration/README.md`](../src/utilities/shade/migration/README.md)

## Re-freeze (G0 path)

```bash
cd /Users/sparsh/Framework
LEGACY_SHADE_ROOT=/Users/sparsh/Design-System \
  node migration-tools/export-legacy-shade-oracle.mjs --from-snapshot
```

Decision refs: **SD-001**, **SD-004**. Gate: **G0**.
