# Golden divergence report

> Phase 0 adjudication. Decision **SD-001**: DS golden is the parity oracle. Decision **SD-002**: intentional deviations must be allowlisted (DEV-*). No emitter behavior changed in this phase.

## Metadata

- Timestamp: `2026-07-18T21:46:26.229Z`
- Provenance manifest: [`legacy-shade-provenance.json`](./legacy-shade-provenance.json)
- DS snapshot SHA-256: `6b0283b4e1d87d96d16b7773902f3530b8bafcf5290e2f8bb556e436f29f2277`
- Framework snapshot SHA-256: `6d46f3f543285a29ef46eb672a62542400546be3b8bc4d6788c6847b2925597c`
- DS rows / unique keys: **142080** / **106560**
- Framework rows / unique keys: **142080** / **106560**
- Index-aligned differing rows: **1680**
- Unique-key differing first values: **840**

## Summary

| Divergence class | Unique-key count | Index count | Adjudication |
|---|---:|---:|---|
| `ADAPTIVE_DARK_CLASS_MISMATCH` | 840 | 1680 | DS target (`SD-001`) |

## Divergence classes (unique-key first-value)

### `ADAPTIVE_DARK_CLASS_MISMATCH` (840)

- **Adjudication:** DS is target (`SD-001`)
- **Note:** Framework must eventually match DS golden output for this class.
- **Dimension breakdown:**
```json
{
  "pattern": {
    "interactive": 630,
    "surface": 210
  },
  "variant": {
    "solid": 240,
    "solidOutline": 240,
    "ghost": 240,
    "outline": 120
  },
  "appearance": {
    "dualTone": 480,
    "soft": 360
  },
  "state": {
    "default": 140,
    "disabled": 140,
    "error": 140,
    "hover": 70,
    "pressed": 70,
    "selected": 70,
    "focus": 70,
    "loading": 70,
    "indeterminate": 70
  },
  "channel": {
    "full": 840
  },
  "palette": {
    "brand": 84,
    "danger": 84,
    "success": 84,
    "warning": 84,
    "info": 84,
    "neutral": 84,
    "white": 84,
    "black": 84,
    "transparent": 84,
    "accent-1": 84
  },
  "emitKey": {
    "adaptive": 840
  }
}
```
- **Representative examples:**
  - key: `interactive|solid|soft|default|full|brand|adaptive`
    - DS: `bg-brand-100 text-brand-700 outline-none border-none`
    - FW: `bg-brand-100 text-brand-700 outline-none border-none dark:bg-brand-100 dark:text-brand-700 dark:outline-none dark:border-none`
    - membershipMatch: false
  - key: `interactive|solid|soft|default|full|danger|adaptive`
    - DS: `bg-danger-100 text-danger-700 outline-none border-none`
    - FW: `bg-danger-100 text-danger-700 outline-none border-none dark:bg-danger-100 dark:text-danger-700 dark:outline-none dark:border-none`
    - membershipMatch: false
  - key: `interactive|solid|soft|default|full|success|adaptive`
    - DS: `bg-success-100 text-success-700 outline-none border-none`
    - FW: `bg-success-100 text-success-700 outline-none border-none dark:bg-success-100 dark:text-success-700 dark:outline-none dark:border-none`
    - membershipMatch: false
  - key: `interactive|solid|soft|default|full|warning|adaptive`
    - DS: `bg-warning-100 text-warning-700 outline-none border-none`
    - FW: `bg-warning-100 text-warning-700 outline-none border-none dark:bg-warning-100 dark:text-warning-700 dark:outline-none dark:border-none`
    - membershipMatch: false
  - key: `interactive|solid|soft|default|full|info|adaptive`
    - DS: `bg-info-100 text-info-700 outline-none border-none`
    - FW: `bg-info-100 text-info-700 outline-none border-none dark:bg-info-100 dark:text-info-700 dark:outline-none dark:border-none`
    - membershipMatch: false

## Index-alignment notes

Canonical snapshots share the same row count (142080). Index diffs: 1680.
When keys align at the same index, class-string mismatches mirror the unique-key classes above.

## Intentional deviation allowlist (planned — not implemented)

| ID | Topic | Status | Decision |
|---|---|---|---|
| DEV-001 | `transparent` FULL path behaves like black | planned correction; harness allowlist seeded | SD-002 |
| DEV-002 | `underline` / `solidUnderline` lack real recipes | planned correction; harness allowlist seeded | SD-002 |

## Contract reminder

- **SD-004**: parity contract is exact class string (order + membership), byte-for-byte vs DS oracle.
- Future membership-only relaxation is a tracked cleanup, not in scope for G0.
