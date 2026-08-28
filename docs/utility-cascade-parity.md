# Utility cascade parity (Tailwind v4)

How IUI orders utilities in generated CSS so composed classes behave like Tailwind. This is **source-order cascade**, not `!important` hacks.

## How it works

1. **Longhands over shorthands** — e.g. `mt-0` after `m-4` so top margin stays `0`.
2. **Modifiers after presets** — e.g. `leading-snug` after `text-base`, `animate-ease-linear` after `animate-fade-in`.
3. **CSS-variable composition** — ring, shadow, divide, and space use `--iui-*` variables so unrelated emission order does not break composition.
4. **Batch optimizer emission sort** — when selectors are merged by property signature, `propertyGroupCascadeEmissionRank` re-orders groups before CSS is written (large builds).

Implementation: `src/engine/core/optimizer.ts` (`compareUtilitiesForCascade`, `propertyGroupCascadeEmissionRank`).

---

## Optimized (Tailwind-standard)

| Family | Example | Mechanism | Tests |
|--------|---------|-----------|-------|
| Margin / padding | `m-4 mt-0`, `p-4 pt-0` | Shorthand cascade spec | `shorthand-cascade.test.ts`, `utility-cascade-parity.test.ts` |
| Scroll margin / padding | `scroll-m-4 scroll-mt-0` | Shorthand cascade spec | same |
| Border width / color / style | `border border-t-0`, `border-red-500 border-t-red-500` | Shorthand cascade spec | `border-utilities.test.ts`, `utility-cascade-parity.test.ts` |
| Line height | `text-base leading-snug` | Font bundle rank 0; `leading-*` rank 2 at emit | `line-height-utilities.test.ts`, `utility-cascade-parity.test.ts` |
| Text decoration | `underline decoration-solid` | `text-decoration-line` longhand + modifier rank | `text-decoration-utilities.test.ts`, `utility-cascade-parity.test.ts` |
| Animation | `animate-fade-in animate-ease-linear` | Preset longhands rank 0; modifiers rank 2 | `animation-timing-function.test.ts`, `utility-cascade-parity.test.ts` |
| Divide children | `divide-y-2 divide-y-reverse` | Child rank + `--iui-divide-*` vars | `divide-utilities.test.ts`, `utility-cascade-parity.test.ts` |
| Space children | `space-x-4 space-x-reverse` | Child rank + `--iui-space-*` vars | `utility-cascade-parity.test.ts` |
| Ring + shadow | `ring-4 shadow-sm` | `--iui-ring-*` + `--iui-shadow` on shared `box-shadow` | `ring-utilities.test.ts` |
| Gradients | `from-* via-* to-*` | Separate `--iui-gradient-*` stops; `via` never sets `--iui-gradient-to` | `gradient-to-cascade.test.ts` |
| Variants | `hover:text-red-500` vs `text-blue-500` | Variant depth sort | `dark-variant-specificity.test.ts` |
| Transforms | `scale-50 rotate-45` | Transform merge + combined selectors | optimizer transform groups |

---

## Order-independent (by design)

These families use **separate CSS properties** or **CSS variables**, so emission order does not need special ranking:

| Family | Example | Why |
|--------|---------|-----|
| Transition | `transition-colors duration-300` | Only longhands (`transition-property`, `transition-duration`, …) |
| Font size + tracking | `text-lg tracking-wide` | Different properties |
| Font size + weight | `text-xl font-bold` | Different properties |
| Gap | `gap-4 gap-x-2` | Axis vars / separate longhands |
| Flex / grid placement | `flex-col items-center` | Unrelated properties |
| Colors (text vs bg) | `text-red-500 bg-blue-500` | Unrelated properties |
| Outline | `outline outline-2 outline-red-500` | Separate longhands (no outline shorthand utility) |
| Filter / backdrop | `blur brightness-50` | Separate properties |

---

## Known gaps / not Tailwind utilities

| Item | Status | Notes |
|------|--------|-------|
| `text-decoration-color-*` alias | Extra (not TW) | Use `decoration-{color}` only |
| `decoration-none` style | Extra (not TW) | Remove for strict parity |
| `decoration-slice` / `decoration-clone` | Legacy | TW v4 uses `box-decoration-slice` / `box-decoration-clone` |
| `-underline-offset-*` | Missing | TW v4 negative offset utilities |
| Batch emit sort for unrelated groups | Neutral rank `1` | Stable among fillers; cascade families use ranks `0` / `2` |

---

## Verifying locally

```bash
cd Framework-updated
npm run build:node
npx jest tests/server/utility-cascade-parity.test.ts tests/server/shorthand-cascade.test.ts tests/server/line-height-utilities.test.ts tests/server/text-decoration-utilities.test.ts tests/server/animation-timing-function.test.ts tests/server/ring-utilities.test.ts tests/server/divide-utilities.test.ts --no-cache
```

After framework changes, restart docs with `npm run dev:clean` (clears Vite + stale `.iui` CSS). Use the port Vite prints (not an old 5173 instance).
