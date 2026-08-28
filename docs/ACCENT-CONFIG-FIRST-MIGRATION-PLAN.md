# Accent Config-First Migration Plan (Framework + CLI)

## Goal
Move to a strict config-first color model with no framework hardcoded chromatic base palettes as runtime/build authority.

Final rule:
- Framework-owned contracts: `brand`, `neutral`, `semantic` (semantic names remain fixed: `success`, `warning`, `danger`, `info`)
- User-owned palette registry: `theme.colors.accent` (any key + hex)
- Utility categories remain generic (`bg-*`, `text-*`, `ring-*`, etc.)
- Any token like `bg-red-500` or `bg-cool-500` works only when that palette key exists in config and has generated vars.

---

## Non-Negotiable Decisions

1. No workarounds: remove static chromatic fallback behavior from framework token resolution.
2. No dual truth: runtime exports and compile pipeline must read the same resolved config palette map.
3. Hex-first for semantic/neutral/brand internals:
   - `semantic.danger: "red"` must resolve through the config palette registry (`accent.red`) and then to hex-generated shades.
   - `brand.set: "teal"` must resolve through the config palette registry (`accent.teal`) and then to hex-generated shades.
   - Direct hex on `brand`, `neutral`, `semantic` stays supported.
4. Keep semantic names fixed (`danger`, `warning`, etc.) but remove dependency on framework hardcoded `red-*` / `amber-*` values.

---

## Target Architecture

1. Build loads config.
2. Framework resolves a single palette registry:
   - Keys: all `theme.colors.accent` keys.
   - Values: canonical base hex per key.
3. Palette generator produces `50..950` for each key.
4. Brand/semantic/neutral resolve from that registry or direct hex.
5. Utility getter emits `var(--iui-color-{palette}-{shade})` for shaded color tokens.
6. No static `values.ts` chromatic hex should override config-driven palette vars.

---

## Framework Plan

### Phase F1 - Remove static chromatic authority

Files:
- `src/engine/tokens/values.ts`
- `src/engine/utilities/helpers.ts`
- `src/server/get-config-palettes.ts`
- `src/configuration/theme-options.ts`

Changes:
1. Remove hardcoded chromatic ramps (`red-*`, `amber-*`, `green-*`, etc.) as runtime authority.
2. Remove hardcoded `accent-1..accent-12` catalog as authority.
3. Update `createColorValueGetter()` to prefer config-generated CSS vars for shaded tokens.
4. Restrict `availableColorPalettes` to framework contracts + config-derived palette keys.
5. Stop seeding palette discovery from static token catalog for chromatic sets.

Acceptance checks:
- `bg-red-500` uses config-defined red var value, not old hardcoded hex.
- Unknown palette key (not configured) does not silently fall back to framework chromatic hex.

### Phase F2 - Canonical palette registry resolution

Files:
- `src/server/generate-theme-css.ts`
- `src/core/config-loader.ts`
- `src/core/auto-config.ts`
- `src/configuration/theme-options.ts`

Changes:
1. Add canonical resolver: palette key -> base hex (from `theme.colors.accent`).
2. For `brand`, `semantic`, `neutral`:
   - if value is hex: use directly.
   - if value is name: resolve from canonical palette registry.
3. Ensure compile path and runtime accessors share the same resolved map.
4. Ensure no path resolves semantic/brand names via old static `values.ts` colors.

Acceptance checks:
- `semantic.danger: "red"` produces `danger-*` from `accent.red` hex.
- `brand.set: "teal"` produces `brand-*` from `accent.teal` hex.
- `neutral.set` path stays deterministic and hex-driven (also emits theme gray `gray-2` … `gray-98`).

### Phase F3 - Validation and failure policy

Files:
- `integrations/shared/generate-build-css.mjs`
- `integrations/shared/validate-build-css.mjs`
- `src/server/get-config-palettes.ts`

Changes:
1. Add strict validation for named palette references.
2. If semantic/brand points to missing accent key, fail with clear error.
3. Keep optional lenient mode only if explicitly enabled (not default).
4. Expand diagnostics to show exact missing key and where used.

Acceptance checks:
- Missing `accent.red` while `danger: "red"` yields deterministic build error.
- Build output has no hidden fallback to old hardcoded red values.

### Phase F4 - Tests and docs hardening

Files:
- `tests/utilities/color-utility-categories.test.ts`
- `tests/server/*color*.test.ts`
- `docs/01-compile-first-guide.md`
- `docs/03-framework-architecture-full-flow.md`

Changes:
1. Add regression tests for:
   - user-customized `red` via accent config
   - semantic alias to accent key
   - brand alias to accent key
   - unknown palette strict failure
2. Update docs to new contract (no framework chromatic defaults as source-of-truth).

---

## CLI Plan

### Phase C1 - Config scaffolding contract

Files:
- `scripts/createconfig.js`
- CLI template files used by `iui init`

Changes:
1. Scaffold a default `accent` palette map with current known default hexes (same values currently used across system) as starter keys.
2. Scaffold `brand`, `semantic`, `neutral` so they point to those starter keys or direct hashes (as per final decision), never implying framework-owned chromatic fallback.
3. Remove scaffold messaging that suggests fixed numbered accent slots.

### Phase C2 - CLI doctor/lint checks

Files:
- CLI validation/doctor command handlers

Checks to add:
1. Named semantic/brand references must exist in accent map.
2. Duplicate/conflicting palette key definitions should be warned.
3. Enforce hash format checks and report invalid color definitions.
4. Recommend migration if old `accent-1..12` only pattern is detected.

### Phase C3 - Migration helper command

New command (recommended):
- `iui migrate colors-config-first`

Behavior:
1. Detect old style config.
2. Generate a proposed accent map using existing hashes.
3. Rewrite semantic/brand references safely.
4. Output diff + manual review checklist.

---

## Cross-Repo Alignment Rules

1. Framework must be merged first (strict config-first logic + tests).
2. CLI updates second (scaffold + doctor + migration helper).
3. Components infrastructure third (storybook/options/scripts alignment).
4. UI component-level refactors happen after infra handoff (separate file owned by component developer).

---

## Rollout Plan

### Milestone M1 - Framework strict mode behind flag
- Implement new resolver and tests.
- Add temporary compatibility flag only if required for controlled rollout.

### Milestone M2 - CLI default flips
- New scaffold and doctor enforce config-first contract.

### Milestone M3 - Remove compatibility path
- Remove legacy fallback entirely once components and docs are green.

---

## Definition of Done

1. No hardcoded chromatic base colors can override user config in emitted utilities.
2. Semantic/brand named references resolve through accent registry or explicit hex only.
3. Build fails clearly on unresolved named palette references.
4. CLI scaffolds and validates the new contract.
5. Components infrastructure consumes config-derived palette keys everywhere (no static palette lists).
