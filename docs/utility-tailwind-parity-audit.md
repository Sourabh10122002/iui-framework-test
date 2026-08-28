# IUI Framework vs Tailwind CSS — Utility Parity Audit

**Date:** 2026-08-13  
**Scope:** `Framework-updated` engine utilities (`parser.ts`, `class-utilities.ts`, `values.ts`, `value-getters.ts`, `builders.ts`, `generated-utility-prefixes.mjs`)  
**Reference baseline:** Tailwind CSS **v4** core utilities, plus **tailwindcss-animate** patterns where IUI already implements `animate-*` modifiers.  
**Status:** Read-only audit — no code changes.

---

## Methodology

1. Catalogued ~170 `TokenCategory` entries, 178 token prefixes, 252 standalone utilities.
2. Compared naming, fixed scales, aliases, and CSS output semantics to Tailwind v4 docs/behavior.
3. **Excluded** documented intentional IUI differences (logical-first API).
4. Classified each finding as **Extra**, **Duplicate**, or **Non-standard** (behavior/naming mismatch).

### Intentional differences (NOT flagged below)

| Tailwind (physical) | IUI (logical) | Notes |
|---------------------|---------------|-------|
| `left-*` / `right-*` | `start-*` / `end-*` | Positioning + inset |
| `ml-*` / `mr-*` | `ms-*` / `me-*` | Margin inline |
| `pl-*` / `pr-*` | `ps-*` / `pe-*` | Padding inline |
| `border-l-*` / `border-r-*` | `border-s-*` / `border-e-*` | Border color/width |
| `text-left` / `text-right` | `text-start` / `text-end` | Primary API; physical aliases still parse |
| `rounded-tl/tr/bl/br` | `rounded-ss/se/es/ee` | Primary API; `rounded-ts/te/bs/be` + `rounded-l/r` aliases |
| `shadow-l-*` / `shadow-r-*` | `shadow-s-*` / `shadow-e-*` | Logical naming (physical `shadow-l/r` not emitted) |
| `fade-in-left/right`, `slide-in-left/right` | `fade-in-start/end`, `slide-in-start/end` | Animation presets map to LTR keyframes |

---

## Summary counts (high level)

| Category | Extra | Duplicate | Non-standard |
|----------|------:|----------:|-------------:|
| Colors & theme | Large palette extensions | Some alias tokens | Semantic color names |
| Spacing & sizing | Semantic aliases, extra scales | Overlapping numeric paths | `gap-none`/`gap-normal` |
| Ring | Directional + block-axis rings | **`ring` + `ring-1`**, `ring-inset`/`inset-ring` | **Bare `ring` = 2px** (TW = 1px) |
| Border | Widths 3,5,6,7; extra styles | **`border` + `border-1`** | Open numeric widths |
| Shadow | `2xs`, `xs`, inset-* family, directional | `shadow-2xs` ≡ `shadow-xs` | Extra sizes vs TW fixed set |
| Typography | `text-2xs`, `font-regular`, `sentencecase` | `font-regular`/`font-normal`, transform aliases | `font-regular` preferred over `font-normal` |
| Animation | Many presets + semantic timing | `ease-*` vs `animate-ease-*`, `duration-*` vs `animate-duration-*` | Modifier prefix split |
| Lists | **40+ marker types** | `list-*` shorthand vs `list-style-type-*` | Non-TW marker vocabulary |
| Layout / flex / grid | `*-safe`, `baseline-last`, `col-start-13` | `grow`/`flex-grow`, position duplicates | Extra grid line numbers |
| Filters / effects | Named perspective, extra easings | Bare `blur`/`grayscale`/… + prefixed | — |
| Framework-only | tooltip, outline-semantic, gradients | — | DS/shade integration |

---

## 1. Extra utilities (in IUI, not in Tailwind v4)

### 1.1 Colors & palette

| Utility pattern | Source | Notes |
|-----------------|--------|-------|
| `gray-2`, `gray-4`, … `gray-98` (even steps) | `values.ts` colors | IUI theme gray ramp; not TW palette |
| `brand-*`, `success-*`, `danger-*`, `warning-*`, `info-*` | Theme semantic colors | Product tokens |
| `accent-1-*` … `accent-12-*` | Theme accent slots | 12 accent palettes |
| `{palette}-neutral-{shade}` | Color regex | e.g. `bg-brand-neutral-500` |
| `primary`, `secondary`, `accent` as bare color names | Border-s/e color regex | On logical border colors only |

### 1.2 Spacing & gap

| Utility | TW equivalent | Notes |
|---------|---------------|-------|
| `p-*` / `m-*` / `gap-*` with `xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl` | Fixed numeric only | Semantic spacing aliases (`helpers.ts` SEMANTIC_SPACING) |
| `gap-sm`, `gap-md`, `gap-lg` | — | Also in spacing scale |
| `gap-none` | `gap-0` | Extra keyword |
| `gap-normal` | — | CSS `normal` for gap; not a TW utility |

### 1.3 Sizing

| Utility | Notes |
|---------|-------|
| `text-2xs` | Extra font size below `xs` |
| `inline-3xs`, `inline-2xs`, `max-inline-3xs`, etc. | Container size tokens beyond TW |
| `max-w-3xs`, `max-w-2xs` | Extra container widths |
| `aspect-golden`, `aspect-ultrawide` | Named ratios; TW has `square`, `video`, `auto` |
| `columns-3xs`, `columns-2xs`, `column-width-*` full spacing scale | Extended column API |

### 1.4 Ring (beyond TW)

| Utility | Notes |
|---------|-------|
| `ring-t-*`, `ring-b-*`, `ring-s-*`, `ring-e-*`, `ring-x-*`, `ring-y-*` | Directional ring widths |
| `ring-bs-*`, `ring-be-*` | Block-axis ring (≈ top/bottom in horizontal-tb) |
| `ring-{axis}-{color}` | Per-side ring colors |
| Open numeric `ring-{N}` for any N | `dynamic.ts` 1px steps beyond `0,1,2,4,8` |

### 1.5 Border

| Utility | Notes |
|---------|-------|
| `border-3`, `border-5`, `border-6`, `border-7` | TW v4 fixed set: `border` (1px), `0`, `2`, `4`, `8` |
| `border-{groove,ridge,inset,outset}` | TW has solid/dashed/dotted/double/hidden/none |
| `border-bs-*`, `border-be-*` | Block-axis border widths |
| Open numeric `border-{N}` | Any integer → Npx |

### 1.6 Border radius

| Utility | Notes |
|---------|-------|
| `rounded-xs` | TW smallest named is typically `sm` |
| `rounded-{N}` → N rem | Open numeric radius |
| `border-bs-*`, `border-be-*` on radius | Block-start/end corner groups |

### 1.7 Shadow

| Utility | Notes |
|---------|-------|
| `shadow-2xs`, `shadow-xs` | Below TW `sm` |
| `shadow-inset-2xs` … `shadow-inset-2xl` | Full inset shadow family |
| `shadow-t-*`, `shadow-e-*`, `shadow-b-*`, `shadow-s-*` | Directional drop shadows |
| `shadow-{t,e,b,s}-{color}` | Directional shadow colors |
| `text-shadow`, `text-shadow-{sm,md,lg}` | TW v4 added `text-shadow-*`; sizes differ slightly |

### 1.8 Typography

| Utility | Notes |
|---------|-------|
| `font-regular` | IUI canonical name for weight 400 |
| `text-transform-sentencecase` | Custom (first-letter uppercase) |
| `font-feature-{name}` | OpenType feature presets |
| `font-stretch-*` | Full font-stretch scale |
| `text-{N}` numeric font sizes | e.g. `text-16` → computed px/rem |

### 1.9 Transitions & animation

| Utility | Notes |
|---------|-------|
| `duration-fast`, `duration-normal`, `duration-slow` | Semantic aliases |
| `delay-fast`, `delay-normal`, `delay-slow` | Same |
| `ease-bounce`, `ease-elastic`, `ease-back` | Custom cubic-bezier curves |
| `ease` / `ease-in` / `ease-out` / `ease-in-out` **duplicate** TW names inside `ease-*` AND `transition-timing` | Also sets `animation-timing-function` |
| `transition-normal`, `transition-discrete` | `transition-behavior` (TW v4 has `transition-normal`) |
| **Animation presets** beyond TW core: | |
| `animate-fade-in/out`, `animate-fade-in-up/down/start/end` | tailwindcss-animate-style set |
| `animate-slide-in-*`, `animate-scale-in/out`, `animate-zoom-in/out`, `animate-rotate-in/out` | Extended preset library |
| `animate-scale-in-center` | Extra preset |
| `animate-duration-*`, `animate-delay-*`, `animate-iteration-*`, `animate-direction-*`, `animate-fill-*`, `animate-play-*`, `animate-ease-*` | tailwindcss-animate modifiers (partial TW parity) |
| `animate-duration-fast/normal/slow` etc. | Semantic names on animation modifiers |

### 1.10 Lists (largest extra surface)

Tailwind: `list-none`, `list-disc`, `list-decimal`, `list-inside`, `list-outside`, `list-image-*`.

IUI adds **`list-*` shorthand** with custom counter styles:

**Ordered (`list-style-type-ordered`):**
- `list-decimal-leading-zero`
- `list-{decimal,upper-roman,upper-alpha,lower-alpha,lower-roman}-{period,parentheses,double-parentheses}`

**Unordered (`list-style-type-unordered`):**
- `list-disc`, `list-circle`, `list-square` (TW-parity subset)
- `list-none`, `list-disclosure-open/closed`
- `list-square-double`, `list-square-hollow`, `list-diamond-cluster`, `list-diamond-outline`
- `list-arrow-across`, `list-arrow-right`, `list-right-arrow`, `list-down-arrow`, `list-arrowhead`
- `list-diamond`, `list-pointer`, `list-star`, `list-bullet`, `list-plus`, `list-minus`, `list-dash`
- `list-check`, `list-tick`, `list-cross`, `list-smiley`, `list-frown`, `list-x-mark`

**Long-form:** `list-style-type-{custom}`

### 1.11 Layout, flex, grid

| Utility | Notes |
|---------|-------|
| `justify-*-safe`, `items-*-safe`, `place-*-safe`, `self-*-safe` | TW v4 `*-safe` alignment (parity) — included if TW has them |
| `items-baseline-last`, `self-baseline-last` | TW v4 addition |
| `col-start-13`, `col-end-13` | Beyond TW 1–12 + auto |
| `grow-1` | Numeric grow beyond `grow`/`grow-0` |
| `overflow-type-*` | Prefix variant on overflow |
| `writing-vertical-es`, `writing-sideways-*`, etc. | Extended writing-mode vocabulary |
| `container-type-*`, `container-name-*` | Container queries (TW v4 has these — parity) |

### 1.12 Filters & transforms

| Utility | Notes |
|---------|-------|
| `perspective-dramatic`, `perspective-near`, `perspective-normal`, `perspective-midrange`, `perspective-distant` | Named perspective presets |
| `perspective-{100…3000}` | Dense numeric scale |
| `style-flat`, `style-preserve-3d` | `transform-style` (TW: `transform-flat`, `preserve-3d` naming differs) |

### 1.13 Mask, columns, scrollbar

| Utility | Notes |
|---------|-------|
| Full `mask-*` family (clip, composite, origin, position, repeat, size, type) | TW v4 mask utilities — largely parity |
| `column-rule-{none,thin,medium,thick}`, `column-rule-type-*`, `column-rule-color-*` | Extended multicol API |
| `scrollbar-gutter-*`, `scrollbar-width-*`, `scrollbar-color-*` | TW v4 scrollbar utilities |

### 1.14 Framework / product extensions

| Utility | Notes |
|---------|-------|
| `outline-focus`, `outline-danger`, `outline-disabled`, `outline-interactive` | Semantic 2px outline shortcuts |
| `bg-gradient-{name}`, `text-gradient-{name}` | Theme config gradient utilities |
| `p-{sm,md,lg}-{padding,fontsize,maxwidth}` (tooltip category) | Component tooltip sizing |
| Shade matrix classes (`bg-brand-500`, variant expansions) | DS layer — not TW |

### 1.15 Open numeric (applies across many categories)

IUI accepts `\d+(\.\d+)?` on most spacing/sizing/ring/border utilities where TW only documents a **fixed scale** + arbitrary `[...]` syntax:

- `p-13`, `w-72`, `ring-3`, `border-9`, `rounded-5`, `opacity-33`, `leading-11`, `tracking-4`, etc.
- These are **extra** relative to TW's documented fixed tokens (though TW arbitrary values can express the same).

---

## 2. Duplicate utilities (two+ paths to same or overlapping CSS)

### 2.1 Ring & border width (user-reported pattern)

| Pair | Issue |
|------|-------|
| **`ring` + `ring-1`** | `ring` → **2px** width; `ring-1` → **1px**. In TW v4, bare `ring` **is** the 1px case — so `ring` overlaps semantically with TW's `ring` but matches TW's `ring-2` width. |
| **`ring` + `ring-2`** | `ring` and `ring-2` both resolve to **2px** — true duplicate output. |
| **`border` + `border-1`** | Both → 1px border width. |
| **`border` + `border-default`** | `default` token also 1px. |

### 2.2 Ring inset naming

| Pair | Issue |
|------|-------|
| `ring-inset` + `inset-ring` | Both set `--iui-ring-inset: inset` (parser accepts both). TW v4 uses `inset-ring`. |

### 2.3 Flex grow/shrink

| Pair | Issue |
|------|-------|
| `grow` / `grow-0` | `flex-grow` / `flex-grow-0` | Same CSS |
| `shrink` / `shrink-0` | `flex-shrink` / `flex-shrink-0` | Same CSS |

### 2.4 Typography transforms

| Pair | Issue |
|------|-------|
| `uppercase`, `lowercase`, `capitalize`, `normal-case` | `text-transform-uppercase`, etc. | Parser rewrites bare → long form |

### 2.5 Font weight

| Pair | Issue |
|------|-------|
| `font-regular` | `font-normal` | Both weight 400 (`values.ts` has both keys) |

### 2.6 Text alignment (legacy)

| Pair | Issue |
|------|-------|
| `text-start` / `text-end` | `text-left` / `text-right` | Same intent; physical aliases kept |

### 2.7 Rounded corners (physical vs logical)

| Pair | Issue |
|------|-------|
| `rounded-ts` | `rounded-ss` | Parser alias |
| `rounded-te` | `rounded-se` | Parser alias |
| `rounded-bs` | `rounded-es` | Parser alias |
| `rounded-be` | `rounded-ee` | Parser alias |
| `rounded-l-*` | `rounded-s-*` | Physical → logical emission |
| `rounded-r-*` | `rounded-e-*` | Physical → logical emission |

### 2.8 Ring block-axis vs physical-axis

| Pair | Issue |
|------|-------|
| `ring-bs-{n}` | `ring-t-{n}` | Same block-start shadow (horizontal-tb) |
| `ring-be-{n}` | `ring-b-{n}` | Same block-end shadow |

### 2.9 Shadow sizes

| Pair | Issue |
|------|-------|
| `shadow-2xs` | `shadow-xs` | Identical CSS in `values.ts` |
| `shadow` (bare) | `shadow-md` implicit default | Both use `default` token |

### 2.10 Decoration color prefix

| Pair | Issue |
|------|-------|
| `decoration-{color}` | `text-decoration-color-{color}` | Same regex / getter |

### 2.11 Transition vs animation timing

| Pair | Issue |
|------|-------|
| `ease-linear` | `animate-ease-linear` | Both can set `animation-timing-function` |
| `duration-300` | `animate-duration-300` | `duration-*` → transition; `animate-duration-*` → animation |
| `delay-300` | `animate-delay-300` | Shared semantic tokens, different properties |

### 2.12 User select

| Pair | Issue |
|------|-------|
| `select-none`, `select-text`, `select-all`, `select-auto` | `user-select` category duplicate | Same CSS property |

### 2.13 Display / position standalones

| Pair | Issue |
|------|-------|
| `position-static` | `static` | Both set `position: static` |
| `hidden` | `none` (display category) | Both hide (`display: none`) — different class names |

### 2.14 Background attachment

| Pair | Issue |
|------|-------|
| `bg-fixed` | `attachment-fixed` | Standalone alias pattern |

### 2.15 Filters (bare vs prefixed)

| Pair | Issue |
|------|-------|
| `blur` | `blur-md` default | Bare blur → 8px default |
| `grayscale` | `grayscale` (0 vs 1) | Bare → full grayscale |
| `backdrop-blur` | bare default 8px | Same pattern |

### 2.16 Snap / scroll

| Pair | Issue |
|------|-------|
| `snap-x`, `snap-y`, `snap-both` standalones | `scroll-snap-type-*` prefixed utilities | Overlapping scroll-snap API |

### 2.17 Color keyword standalones

| Pair | Issue |
|------|-------|
| `current` | `currentcolor` | Standalone tokens in prefix list |

---

## 3. Non-standard utilities (naming or behavior ≠ Tailwind v4)

### 3.1 Wrong default semantics

| Utility | IUI behavior | Tailwind v4 | Severity |
|---------|--------------|-------------|----------|
| **`ring` (bare)** | **2px** ring width (`builder.ts` passes `"2"`) | **1px** ring width | **High** — causes `ring`+`ring-1` confusion |
| `blur` (bare) | 8px | TW `blur` = `blur-sm` (4px) in v4 | Medium |
| `shadow-sm` / `shadow-xs` / `shadow-2xs` | All very similar small shadows | TW distinct scale | Low |

### 3.2 Naming not in TW

| Utility | Issue |
|---------|-------|
| `font-regular` | TW uses `font-normal`; `font-regular` is non-standard (though `font-normal` also works) |
| `text-transform-sentencecase` | Not a CSS `text-transform` value |
| `gap-none` | TW uses `gap-0` |
| `transition-discrete` | TW v4 uses `transition-discrete` → OK; verify value maps to `allow-discrete` |
| `style-flat` / `style-preserve-3d` | TW: `transform-flat` / `transform-3d` or `preserve-3d` naming |
| `grow-1` | TW: `grow` already means `flex-grow: 1` |
| `overflow-type-*` | Non-TW prefix pattern |
| `animate-iteration-*` | tailwindcss-animate uses `animate-infinite`, `animate-once`, etc. — different vocabulary |
| `animate-play-running/paused` | Non-TW naming (`running`/`paused` without `play-` in TW animate plugin) |

### 3.3 Scale mismatches (fixed tokens)

| Scale | IUI | Tailwind v4 |
|-------|-----|-------------|
| Ring width | `0, 1, 2, 4, 8` + bare `ring`→2px + any numeric | `ring`(1px), `ring-2`, `ring-4`, `ring-8`, `ring-0` — **no `ring-1`** as separate (redundant with `ring`) |
| Border width | `0–8` all integers + bare | `border`, `border-0`, `border-2`, `border-4`, `border-8` |
| Border radius | includes `xs` | `sm` is smallest named |
| Opacity | includes `25`, `75` | TW has these — parity |
| Animation duration | up to `3000` + semantics | TW `duration-*` similar; animate modifiers from plugin |

### 3.4 Scan vs parse inconsistency (non-standard DX)

| Token | Scan filter | Parser |
|-------|-------------|--------|
| `pl-4`, `left-6`, `ml-2` | **Rejected** | Some physical forms still work via arbitrary CSS mapping |
| `text-left` | Accepted | Emits logical `text-align` |
| `rounded-l-none` | Accepted | Maps to logical radius |

### 3.5 List utilities (non-TW vocabulary)

All `list-{marker}` beyond `disc` / `decimal` / `none` use **custom `@counter-style` / `::marker` rules** — class names are IUI-specific, not TW class names.

---

## 4. Missing from IUI (Tailwind has, IUI intentionally omits or incomplete)

| Tailwind utility | IUI status |
|------------------|------------|
| `pl-*`, `pr-*`, `ml-*`, `mr-*` | **Intentionally omitted** — use `ps/pe`, `ms/me` |
| `left-*`, `right-*` | **Intentionally omitted** — use `start/end` |
| `border-l-*`, `border-r-*` | **Intentionally omitted** — use `border-s/e` |
| `shadow-l-*`, `shadow-r-*` | **Not implemented** — use `shadow-s/e`; filter rejects `shadow-l-*` |
| `font-normal` | Works but **not canonical** — prefer `font-regular` in IUI |
| `list-disc` / `list-decimal` as `list-style-type` utilities | **Renamed path**: use `list-disc` via `list-*` shorthand (same class string, different engine category) |
| `divide-x-reverse` / `divide-y-reverse` | Present — TW v4 parity |
| `inset-ring` | Present (TW v4) |
| `field-sizing-*`, `text-shadow-*` (full TW v4 set) | Partial — verify if TW v4 additions are fully covered |

---

## 5. Category-by-category quick reference

### Ring (detailed — user example)

```
Tailwind v4:  ring → 1px   ring-2 → 2px   ring-4 → 4px   ring-8 → 8px   ring-0 → none   inset-ring
IUI:          ring → 2px   ring-1 → 1px   ring-2 → 2px   ring-4 → 4px   ring-8 → 8px   ring-0 → none
              ring-inset | inset-ring (dup)
              + ring-t/b/s/e/x/y/bs/be-{N}  (extra)
              + ring-{axis}-{color}         (extra)
              + ring-{N} any integer        (extra)
```

**Verdict:** `ring` bare utility is **non-standard** (2px not 1px) and **duplicates** `ring-2`.

### Border

```
Tailwind v4:  border → 1px   border-0/2/4/8
IUI:          border → 1px   border-1 → 1px (dup)   border-0..8 (extra widths 1,3,5,6,7)
              + border-bs/be widths (logical block axis)
```

### Spacing numeric

Both support 0, px, 0.5–96, fractions. IUI adds semantic `xs`–`3xl` on spacing getters.

### Colors

TW: default palette + semantic via theme.  
IUI: default palette + **gray-2..98** + **brand/semantic** + **accent-1..12** + **\*-neutral-\*** — large extra surface by design.

---

## 6. Recommended prioritization (for future cleanup — not implemented)

| Priority | Item | Action type |
|----------|------|-------------|
| P0 | Bare `ring` = 2px vs TW 1px | Fix semantics or deprecate bare `ring` |
| P0 | `ring` duplicates `ring-2` | Remove one path |
| P1 | `border` / `border-1` duplicate | Document or collapse |
| P1 | `ring-inset` / `inset-ring` duplicate | Keep TW `inset-ring` only |
| P1 | `font-regular` vs `font-normal` | Pick one canonical |
| P2 | List marker explosion | Split "core TW" vs "extended markers" |
| P2 | Semantic spacing (`gap-sm`) vs numeric | Document or remove |
| P2 | Shadow `2xs`/`xs` duplicate | Merge tokens |
| P3 | Physical aliases (`text-left`, `rounded-l`) | Deprecation path |
| P3 | Open numeric on all scales | Align with TW fixed scale + arbitrary only |

---

## 7. Source files for follow-up

| File | Purpose |
|------|---------|
| `src/utilities/class-utilities.ts` | Regex catalog (`tokenPatterns`) |
| `src/engine/core/parser.ts` | Dispatch, aliases, special cases |
| `src/engine/tokens/values.ts` | Fixed scales |
| `src/engine/tokens/dynamic.ts` | Open numeric resolution |
| `src/engine/utilities/value-getters.ts` | Value → CSS |
| `src/engine/utilities/builders.ts` | Multi-property utilities |
| `src/engine/core/builder.ts` | Bare `ring` → `"2"` hardcode |
| `integrations/shared/generated-utility-prefixes.mjs` | Generated prefix index |
| `integrations/shared/utility-token-filter.mjs` | Scan-time acceptance |

---

*End of audit.*
