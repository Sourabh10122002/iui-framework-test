# Slot Environment API Design (Additive, Backward-Compatible)

Status: Design spec (implementation-ready when RFC-003 is promoted)

---

## Objective

Add optional environment-aware slot rendering to framework runtime with zero breakage for existing slot registrations and slot object shapes.

---

## Proposed Types

```ts
export interface SlotEnvironment<TScope = never> {
  scope?: TScope;
}

export type SlotRenderer<TSlotProps, TScope = never> = (
  slot: TSlotProps,
  env?: SlotEnvironment<TScope>
) => React.ReactNode;
```

Notes:

- `TScope = never` prevents accidental untyped widening.
- `env` remains optional to preserve old renderer ergonomics.

---

## Registry Signature Evolution

### Current behavior

```ts
registerSlot(type, (slot) => ReactNode);
```

### Additive behavior

```ts
registerSlot(type, (slot) => ReactNode);
registerSlot(type, (slot, env) => ReactNode);
```

Implementation should support both by using a unified internal callback signature and optional second parameter dispatch.

---

## Runtime Dispatch Contract

`renderSlot` path receives optional env:

```ts
renderSlot(slot, options?: { env?: SlotEnvironment<any> });
```

Or equivalent function shape in current registry utilities:

- `slot` input unchanged (`{ type, ...props }` contract remains stable).
- `env` passed only when present.
- renderer without `env` parameter still executes normally.

---

## Precedence Rules

For any overlapping values:

1. explicit slot props win,
2. `env.scope` values act only as defaults/fallback,
3. component local context remains state owner.

This avoids hidden behavior overrides and keeps slot configs deterministic.

---

## Backward Compatibility Requirements

1. Existing generated registrations compile unchanged.
2. Existing components calling slot renderer with no env compile unchanged.
3. Existing tests for slot rendering continue to pass.
4. New env-aware paths remain opt-in.

---

## Type Safety Requirements

- No `any` fallback in public slot runtime types.
- Prefer generic defaults (`never`) over `unknown` for long-term API safety.
- If runtime needs temporary internal casts, keep them internal and non-exported.

---

## Suggested Implementation Steps

1. Add `SlotEnvironment<TScope = never>` and renderer type updates in slot type utilities.
2. Extend registry internals to accept and forward optional `env`.
3. Add overloads (or equivalent type unions) to keep old callback shape valid.
4. Add tests:
   - old renderer path,
   - env-aware renderer path,
   - precedence rule verification.

---

## Out of Scope (for this API slice)

- `useSlotRenderer` ergonomic changes before pilot evidence.
- CLI contract changes.
- New provider/hook public API for scope publishing.

---

## Acceptance Criteria

- Type-check passes with no required updates in existing consumers.
- Env-aware renderer can be introduced in pilot components without registry hacks.
- No runtime behavior drift in unaffected components.
