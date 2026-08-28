# Utility gaps vs Tailwind

**Status:** living document — gaps documented for later fixes  
**Baseline:** [Tailwind CSS v4](https://tailwindcss.com/docs) core utilities  
**Source of truth:** `src/utilities/class-utilities.ts` (`TokenCategory` + `tokenPatterns`, ~170 categories)  
**Deep audit:** [utility-tailwind-parity-audit.md](./utility-tailwind-parity-audit.md)

---

## How to read

Each category block has three columns:

| Column | Meaning |
|--------|---------|
| **Issue** | What is wrong, redundant, or confusing in IUI |
| **Tailwind standard** | What v4 documents (fixed scale, keywords, arbitrary `[…]`) |
| **IUI today** | Extra, duplicate, or non-standard utilities in `class-utilities.ts` |

**Legend:** ✅ parity · ⚠️ extra (not in TW) · 🔁 duplicate · ❌ non-standard behavior · 🎯 intentional (logical-first API)

**Numeric & arbitrary (global):** Tailwind uses a **fixed spacing scale** (0, px, 0.5–96, fractions) plus **`utility-[value]`** for anything else. IUI regexes accept **any** `\d+(\.\d+)?` on most length/opacity/filter utilities — extra vs TW docs, but expressible in TW via arbitrary values.

---

## Category index

| # | Area | Gap level | § |
|---|------|-----------|---|
| 1 | Animation / transition timing | High | [§1](#1-animation--transition-timing) |
| 2 | Height container-scale (`h-sm`, `max-h-md`, …) | High | [§2](#2-height-container-scale) |
| 3 | Ring | High | [§3](#3-ring) |
| 4 | Spacing & gap | Medium | [§4](#4-spacing--gap) |
| 5 | Sizing (width / inline) | Medium | [§5](#5-sizing-width--inline) |
| 6 | Border & radius | Medium | [§6](#6-border--radius) |
| 7 | Shadow & opacity | Medium | [§7](#7-shadow--opacity) |
| 8 | Typography | Medium | [§8](#8-typography) |
| 9 | Lists | Medium | [§9](#9-lists) |
| 10 | Flex, grid, layout | Low–medium | [§10](#10-flex-grid--layout) |
| 11 | Filters & transforms | Low | [§11](#11-filters--transforms) |
| 12 | Background & gradients | Low | [§12](#12-background--gradients) |
| 13 | Scroll & columns | Low | [§13](#13-scroll--columns) |
| 14 | Colors & theme | By design | [§14](#14-colors--theme) |
| 15 | Framework-only | By design | [§15](#15-framework-only) |
| 16 | Parity OK (no action) | — | [§16](#16-parity-ok-no-action-needed) |

---

## Intentional differences (not gaps)

| Tailwind (physical) | IUI (logical) | Notes |
|---------------------|---------------|-------|
| `left-*` / `right-*` | `start-*` / `end-*` | Position + inset |
| `ml-*` / `mr-*` | `ms-*` / `me-*` | Margin |
| `pl-*` / `pr-*` | `ps-*` / `pe-*` | Padding |
| `border-l/r-*` | `border-s/e-*` | Border color/width |
| `text-left/right` | `text-start/end` | Primary API; physical aliases still parse |
| `rounded-tl/tr/bl/br` | `rounded-ss/se/es/ee` | + `rounded-ts/te/bs/be` aliases |

---

## 1. Animation / transition timing

**Utilities:** `duration-*`, `delay-*`, `ease-*`, `animate-*`, modifiers  
**TW ref:** [transition-duration](https://tailwindcss.com/docs/transition-duration) · [animation](https://tailwindcss.com/docs/animation)

| Issue | Tailwind standard | IUI today |
|-------|-------------------|-----------|
| Split timing APIs | Core: `duration-*` / `delay-*` / `ease-*` → **transitions only**. Animation speed via `animate-[…]` or theme vars. Plugin (`tailwindcss-animate`) reuses same names for animations. | `duration-*` → transition only; `animate-duration-*` → animation. **`ease-*` dual-writes** transition + animation timing. |
| Duplicate modifiers | No `animate-duration-*`, `animate-delay-*`, `animate-ease-*` in core | ⚠️ `animate-duration-*`, `animate-delay-*`, `animate-ease-*`, semantic `*-fast/normal/slow` |
| Invalid component classes | — | `animation-duration-75` in Tooltip/Popover (invalid) |
| Semantic aliases | Fixed ms scale only | ⚠️ `duration-fast`, `delay-fast`, etc. |

**Verified:** `animate-fade-in duration-1000` → transition 1000ms, animation still 0.3s. Only `animate-duration-1000` changes animation.

**TODO:** Option A — strict core (remove animate-* timing). Option B — dual-write `duration-*`/`delay-*` like `ease-*`; deprecate `animate-duration-*`. See [utility-cascade-parity.md](./utility-cascade-parity.md).

**Keep:** `animate-spin`, `animate-fade-in`, … presets; `animate-iteration-*`, `animate-direction-*`, `animate-fill-*`, `animate-play-*`.

---

## 2. Height container-scale

**Utilities:** `h-*`, `min-h-*`, `max-h-*`, `block-*`, `min-block-*`, `max-block-*` with `xs`–`7xl`  
**TW ref:** [height](https://tailwindcss.com/docs/height) · [max-height](https://tailwindcss.com/docs/max-height)

| Issue | Tailwind standard | IUI today |
|-------|-------------------|-----------|
| T-shirt names on height | **Numeric only** (`h-24`, `max-h-80`) + keywords + `[…]` | ⚠️ `h-sm`, `min-h-md`, `max-h-xl` → 20–80rem container scale |
| Docs imply parity | No height “container scale” section | Documented in Height MDX “Scale” tables |
| Name collision | — | `gap-sm` = 0.5rem vs `h-sm` = 24rem vs component `size="sm"` → `h-5` |
| Unused in prod | — | **0** prod uses; components use `h-8`, `max-h-48`, `max-h-[60vh]` |

**Keep:** `max-w-xs`…`max-w-7xl` (standard; used in Modal, Carousel, Footer).

**TODO:** Remove container-scale from height getters; keep for `max-w-*` only.

---

## 3. Ring

**Utilities:** `ring`, `ring-*`, `ring-{t,b,s,e,x,y,bs,be}-*`, `ring-{axis}-{color}`, `inset-ring`  
**TW ref:** [box-shadow (ring)](https://tailwindcss.com/docs/box-shadow#adding-a-ring)

| Issue | Tailwind standard | IUI today |
|-------|-------------------|-----------|
| Bare `ring` width | **`ring` = 1px** | ❌ **`ring` = 2px** (matches TW `ring-2`, not `ring`) |
| Duplicate width | `ring` ≡ 1px; `ring-2`, `ring-4`, `ring-8` | 🔁 `ring` ≡ `ring-2`; 🔁 `ring-1` = 1px |
| Inset naming | `inset-ring` | 🔁 `ring-inset` + `inset-ring` |
| Directional rings | No per-side ring width/color | ⚠️ `ring-t-*`, `ring-bs-*`, `ring-x-*`, `ring-{axis}-{color}` |
| Open numeric | Fixed: 0, 1 (bare), 2, 4, 8 | ⚠️ Any `ring-{N}` integer |

---

## 4. Spacing & gap

**Utilities:** `m-*`, `p-*`, `gap-*`, `space-*`, `scroll-m/p-*`, block-axis `mbs/mbe/pbs/pbe`  
**TW ref:** [padding](https://tailwindcss.com/docs/padding) · [gap](https://tailwindcss.com/docs/gap)

| Issue | Tailwind standard | IUI today |
|-------|-------------------|-----------|
| Semantic spacing on gap/p/m | Numeric scale only (`gap-4`, `p-2`) | ⚠️ `gap-sm/md/lg`, `p-*`/`m-*`/`gap-*` accept `xs`–`3xl` (different values than container scale) |
| Extra keywords | `gap-0` | ⚠️ `gap-none` (=0), `gap-normal` (=CSS `normal`) |
| Open numeric | Fixed 0–96 + arbitrary | ⚠️ Any `\d+(\.\d+)?` on all spacing regexes |
| Block-axis margin/padding | TW v4 logical | ✅ `mbs`, `mbe`, `pbs`, `pbe` — parity extension |

---

## 5. Sizing (width / inline)

**Utilities:** `w-*`, `min-w-*`, `max-w-*`, `size-*`, `inline-*`, `min/max-inline-*`  
**TW ref:** [width](https://tailwindcss.com/docs/width) · [max-width](https://tailwindcss.com/docs/max-width)

| Issue | Tailwind standard | IUI today |
|-------|-------------------|-----------|
| Container scale | `w-sm`, `max-w-sm`, `min-w-sm` (v4) | ✅ Same tokens on width / max-width / min-width |
| Extra container sizes | `3xs`–`7xl` | ⚠️ `max-inline-3xs`, `max-w-2xs` (IUI extension) |
| Bare `w-sm` usage | Valid in v4 | ⚠️ Supported; **0 prod uses** (only `max-w-*` used) |
| Height on container scale | See §2 | ⚠️ `h-sm`, `block-sm`, `max-block-md` on block axis |
| Open numeric | Fixed + fractions + `[…]` | ⚠️ Any numeric on `w-*`, `h-*`, `size-*` |
| Arbitrary | `w-[220px]`, `max-w-[720px]` | ✅ via dynamic parser (not in static regex) |

---

## 6. Border & radius

**Utilities:** `border-*`, `border-{s,e,t,b,x,y,bs,be}-*`, `rounded-*`, `divide-*`  
**TW ref:** [border-width](https://tailwindcss.com/docs/border-width) · [border-radius](https://tailwindcss.com/docs/border-radius)

| Issue | Tailwind standard | IUI today |
|-------|-------------------|-----------|
| Border width set | `border`, `border-0`, `border-2`, `border-4`, `border-8` | ⚠️ `border-1`…`border-7`, any integer; 🔁 `border` ≡ `border-1` |
| Border styles | solid, dashed, dotted, double, hidden, none | ⚠️ `groove`, `ridge`, `inset`, `outset` |
| Radius smallest | `rounded-sm` | ⚠️ `rounded-xs`; open `rounded-{N}` rem |
| Corner aliases | Physical + logical | 🔁 `rounded-ts` ≡ `rounded-ss`; `rounded-l` → `rounded-s` |
| Block-axis borders | TW v4 `border-bs/be` | ✅ parity |

---

## 7. Shadow & opacity

**Utilities:** `shadow-*`, `shadow-{t,e,b,s}-*`, `shadow-{t,e,b,s}-color`, `opacity-*`, `text-shadow-*`  
**TW ref:** [box-shadow](https://tailwindcss.com/docs/box-shadow) · [opacity](https://tailwindcss.com/docs/opacity)

| Issue | Tailwind standard | IUI today |
|-------|-------------------|-----------|
| Shadow sizes | `sm`, `md`, `lg`, `xl`, `2xl`, `inner`, `none` | ⚠️ `shadow-2xs`, `shadow-xs`; 🔁 `shadow-2xs` ≡ `shadow-xs` |
| Inset shadows | `shadow-inner` | ⚠️ Full `shadow-inset-{2xs…2xl}` family |
| Directional shadows | No `shadow-l/r` (use logical) | ⚠️ `shadow-t/e/b/s-*` + directional colors |
| Bare shadow | Default md-like | 🔁 bare `shadow` ≡ `shadow-md` token |
| Opacity scale | 0, 5, 10, … 100 | ✅ + open numeric |
| Text shadow | TW v4 `text-shadow-*` | ✅ `text-shadow-sm/md/lg` (verify token values) |

---

## 8. Typography

**Utilities:** `text-*`, `font-*`, `leading-*`, `tracking-*`, decoration, wrap, clamp  
**TW ref:** [font-size](https://tailwindcss.com/docs/font-size) · [font-weight](https://tailwindcss.com/docs/font-weight)

| Issue | Tailwind standard | IUI today |
|-------|-------------------|-----------|
| Extra size | `text-xs` smallest named | ⚠️ `text-2xs`; ⚠️ `text-{N}` numeric (e.g. `text-16`) |
| Font weight 400 | `font-normal` | 🔁 `font-regular` + `font-normal`; IUI prefers `font-regular` |
| Transform aliases | `uppercase`, `lowercase`, … | 🔁 bare + `text-transform-*`; ⚠️ `sentencecase` (not CSS) |
| Decoration color | `decoration-{color}` | 🔁 `decoration-*` + `text-decoration-color-*` |
| Open scales | Fixed leading/tracking | ⚠️ `leading-{N}`, `tracking-{N}` any numeric |
| Font extras | — | ⚠️ `font-feature-*`, full `font-stretch-*` scale |
| Line clamp | `line-clamp-{n}` | ✅ 1–999 (TW similar) |

---

## 9. Lists

**Utilities:** `list-*`, `list-style-type-*`, `list-{inside,outside}`, `list-image-*`  
**TW ref:** [list-style-type](https://tailwindcss.com/docs/list-style-type)

| Issue | Tailwind standard | IUI today |
|-------|-------------------|-----------|
| Marker vocabulary | `list-none`, `list-disc`, `list-decimal`, `list-inside/outside` | ⚠️ **40+ custom** `list-*` markers (arrows, diamonds, smiley, …) — IUI-specific names |
| Ordered variants | `list-decimal` | ⚠️ `list-decimal-leading-zero`, `list-upper-roman-period`, … |
| Long-form | — | ⚠️ `list-style-type-{custom}` third path |
| Duplication | Single utility path | 🔁 `list-disc` shorthand vs `list-style-type-*` category split |

**TODO:** Document “core TW” (`disc`, `decimal`, `none`) vs “extended markers” extension set.

---

## 10. Flex, grid & layout

**Utilities:** `flex-*`, `grid-*`, `display`, `position`, `inset`, `overflow`, `aspect-*`, `container`  
**TW ref:** [flex](https://tailwindcss.com/docs/flex) · [display](https://tailwindcss.com/docs/display)

| Issue | Tailwind standard | IUI today |
|-------|-------------------|-----------|
| Grow/shrink shortcuts | `grow`, `grow-0` | 🔁 `grow` + `flex-grow`; 🔁 `shrink` + `flex-shrink`; ⚠️ `grow-1` |
| Display / position dupes | `static`, `hidden` | 🔁 `position-static` + `static`; 🔁 `hidden` + `none` |
| Safe alignment | TW v4 `*-safe` | ✅ `justify-center-safe`, `items-end-safe`, … |
| Baseline last | TW v4 | ✅ `items-baseline-last`, `self-baseline-last` |
| Grid lines | `col-start-1`…`12`, `auto` | ⚠️ `col-start-13`, `col-end-13` |
| Overflow prefix | `overflow-hidden` | ⚠️ `overflow-type-hidden` (non-TW pattern) |
| Writing mode | Standard set | ⚠️ Extended `writing-sideways-*`, … |
| Aspect ratio | `square`, `video`, `auto`, `{n}/{d}` | ⚠️ `aspect-golden`, `aspect-ultrawide`, `landscape`, `portrait` |
| Container | `@container` utility | ⚠️ `container-xs`…`container-full` (named sizes) |
| Object fit dupes | `object-cover` | 🔁 `object-cover` + `object-fit-cover` |

---

## 11. Filters & transforms

**Utilities:** `blur-*`, `brightness-*`, `backdrop-*`, `scale-*`, `rotate-*`, `translate-*`, `perspective-*`  
**TW ref:** [filter](https://tailwindcss.com/docs/filter) · [transform](https://tailwindcss.com/docs/transform)

| Issue | Tailwind standard | IUI today |
|-------|-------------------|-----------|
| Bare filter defaults | `blur` = 8px (v4: blur-sm scale) | ❌ bare `blur` → 8px; verify vs TW default |
| Bare toggles | `grayscale`, `invert`, `sepia` | 🔁 bare + `-0` suffix variants |
| Backdrop open numeric | Fixed scale | ⚠️ backdrop brightness/contrast less open than foreground |
| Transform style | `transform-flat`, `preserve-3d` | ⚠️ `style-flat`, `style-preserve-3d` naming |
| Scale semantics | Percent numeric | ⚠️ `scale-sm`, `scale-md`, … on scale utilities |
| Skew semantics | Degree numeric | ⚠️ `skew-x-sm`, … semantic names |
| Perspective | Numeric + arbitrary | ⚠️ `perspective-dramatic/near/distant`, dense numeric |
| Rotate aliases | Degrees | ⚠️ `rotate-quarter`, `rotate-half`, … |

---

## 12. Background & gradients

**Utilities:** `bg-*`, `attachment-*`, `clip-*`, `from/via/to-*`, `bg-gradient-*`, `text-gradient-*`  
**TW ref:** [background-image](https://tailwindcss.com/docs/background-image)

| Issue | Tailwind standard | IUI today |
|-------|-------------------|-----------|
| Attachment prefix | `bg-fixed`, `bg-local`, `bg-scroll` | 🔁 `attachment-fixed` standalone alias |
| Gradient directions | `bg-gradient-to-r`, … | ✅ + logical `gradient-to-s/e`; physical `tl/tr/bl/br` in regex |
| Theme gradients | Config / arbitrary | ⚠️ `bg-gradient-{name}`, `text-gradient-{name}` — DS shortcuts |
| Color palette on gradients | TW palette | ⚠️ Extended IUI palettes on `from/via/to` |

---

## 13. Scroll & columns

**Utilities:** `scroll-*`, `snap-*`, `scrollbar-*`, `columns-*`, `column-*`  
**TW ref:** [scroll-snap-type](https://tailwindcss.com/docs/scroll-snap-type) · [columns](https://tailwindcss.com/docs/columns)

| Issue | Tailwind standard | IUI today |
|-------|-------------------|-----------|
| Snap API | `snap-x`, `snap-y`, `snap-both`, `snap-mandatory` | 🔁 standalones + `scroll-snap-*` prefixed set overlap |
| Scroll behavior extras | `auto`, `smooth` | ⚠️ `scroll-inherit/initial/revert/…` |
| Column widths | `columns-{n}` | ⚠️ `columns-3xs`…`7xl`; full `column-width-*` spacing scale |
| Column rule API | Shorthand in TW | ⚠️ Split `column-rule`, `column-rule-type`, `column-rule-color` |
| Scrollbar | TW v4 scrollbar utilities | ✅ `scrollbar-gutter`, `scrollbar-width`, `scrollbar-color` |

---

## 14. Colors & theme

**Utilities:** `text/bg/border/ring/accent/caret/fill/stroke-{color}`, opacity `/30` modifier  
**TW ref:** [colors](https://tailwindcss.com/docs/colors)

| Issue | Tailwind standard | IUI today |
|-------|-------------------|-----------|
| Palette scope | Default + theme config | ⚠️ **By design:** `gray-2…98`, `brand-*`, `accent-1…12`, semantic colors, `*-neutral-*` |
| Bare semantic names | Theme tokens | ⚠️ `primary`, `secondary`, `accent` on some border regexes |
| Keyword dupes | `current` | 🔁 `current` + `currentcolor` standalones |
| Opacity modifier | `bg-black/50` | ✅ slash syntax in regex |

**Action:** Document as DS extensions, not TW parity gaps.

---

## 15. Framework-only

**Utilities:** not in Tailwind

| Utility | Purpose |
|---------|---------|
| `outline-focus`, `outline-danger`, `outline-disabled`, `outline-interactive` | Semantic 2px outlines |
| `p-{sm,md,lg}-{padding,fontsize,maxwidth}`, `text-*-…`, `max-w-*-…` | Tooltip sizing (`tooltip` category) |
| Shade / variant matrix classes | Design-system layer |

---

## 16. Parity OK (no action needed)

These `TokenCategory` groups match Tailwind v4 (logical naming noted in § intentional):

`box-sizing` · `float/clear` (logical) · `isolation` · `visibility` · `overscroll-*` · `flex-direction/wrap/basis` · `justify/align/place-*` (incl. safe) · `order` · `grid-template/auto-flow` · `divide-x/y-reverse` · `mix-blend-mode` · `bg-blend-mode` · `mask-*` (largely v4) · `transition-property` · `transition-behavior` · `appearance` · `cursor` · `pointer-events` · `resize` · `touch-action` · `fill/stroke` SVG · `border-collapse` · `table-layout` · `caption-side` · `break-*` · `z-index` · `content-*` · `text-wrap` · `text-orientation` · `box-decoration-break` · `will-change` · `forced-color-adjust` · `container-type/name` · `sr-only` / `not-sr-only` · `outline-hidden` · `outline-width/style/color/offset` · scroll margin/padding logical axes

---

## Priority matrix (fix order)

| P | Item | Action |
|---|------|--------|
| P0 | Bare `ring` = 2px | Align to TW 1px or document breaking change |
| P0 | `ring` duplicates `ring-2` | Collapse to one path |
| P1 | `animate-duration-*` vs `duration-*` | Pick Option A or B (§1) |
| P1 | Height `h-sm` / `max-h-*` container scale | Remove from height (§2) |
| P1 | `border` / `border-1` duplicate | Collapse or alias |
| P1 | `ring-inset` / `inset-ring` | Keep `inset-ring` only |
| P2 | `gap-sm/md/lg` semantic spacing | Remove or document vs container scale |
| P2 | `font-regular` vs `font-normal` | Pick one canonical |
| P2 | List marker explosion | Split core vs extended docs |
| P2 | `shadow-2xs` / `shadow-xs` duplicate | Merge tokens |
| P3 | Open numeric everywhere | Align to fixed scale + `[…]` only |
| P3 | Physical aliases (`text-left`, `rounded-l`) | Deprecation path |
| P3 | Bare `w-sm` docs | De-emphasize; keep `max-w-*` |

---

## Files to touch (any fix)

| Area | Path |
|------|------|
| Regex catalog | `src/utilities/class-utilities.ts` |
| Parser / aliases | `src/engine/core/parser.ts` |
| Token scales | `src/engine/tokens/values.ts`, `dynamic.ts` |
| Value resolution | `src/engine/utilities/value-getters.ts` |
| Builders (bare ring, etc.) | `src/engine/utilities/builders.ts`, `core/builder.ts` |
| Arbitrary CSS | `src/server/generate-arbitrary-css.ts` |
| Scan filter | `integrations/shared/utility-token-filter.mjs` |
| Tests | `tests/server/*`, `tests/utilities/*` |
| Docs | `IUI-Docs/.../utilities/**`, this file + parity audit |

---

## Appendix: `class-utilities.ts` category checklist

All `TokenCategory` keys in `tokenPatterns` are covered above. Cross-reference:

| Group | Categories (count) | § |
|-------|-------------------|---|
| Colors | 18 | §14 |
| Typography | 22 | §8 |
| Layout | 18 | §10, §16 |
| Flex / grid | 24 | §10 |
| Spacing | 28 | §4 |
| Dimensions | 14 | §2, §5 |
| Borders / ring | 38 | §3, §6 |
| Effects / mask | 18 | §7, §16 |
| Filters | 18 | §11 |
| Background | 10 | §12 |
| Transforms | 14 | §11 |
| Transitions / animation | 11 | §1 |
| Interactivity | 12 | §15, §16 |
| SVG | 7 | §16 |
| Tables | 6 | §16 |
| Lists | 4 | §9 |
| Scroll | 6 | §13 |
| Columns | 7 | §13 |
| Misc | 8 | §10, §15, §16 |

_For per-class behavior proofs and cascade notes, see [utility-tailwind-parity-audit.md](./utility-tailwind-parity-audit.md) and [utility-cascade-parity.md](./utility-cascade-parity.md)._
