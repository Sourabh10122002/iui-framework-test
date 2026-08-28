/**
 * IUI Design System - Utility Value Getters
 * Value getters for each token category
 * Color getters support optional opacity parameter for Tailwind-style opacity modifiers
 */

import { TokenCategory } from '../../utilities/class-utilities';
import * as tokenValues from '../tokens/values';
import { isTailwindFontWeightNumeric } from '../tokens/values';
import { scale, rotate, translate, skew } from '../tokens/values';
import { getDynamicTokenValue, getSpacingValue, getBorderWidthValue, getRingWidthValue, getFontSizeValue } from '../tokens/dynamic';
import { typographyExtendTokens } from '../../configuration/theme-options';
import { SPECIAL_VALUES } from './constants';
import {
  buildBackgroundGradientImage,
  isGradientStopPosition,
} from './gradient-stops';
import { 
  parseNegativeValue, 
  createColorValueGetter, 
  getSmartSpacingValue, 
  resolveGapSpacingValue,
  getSmartPositioningValue, 
  getSmartHueRotateValue,
  getSmartWidthValue,
  getSmartHeightValue,
  viewportLengthForMinMaxWidth,
  viewportLengthForMinMaxHeight
} from './helpers';
import { resolveOrderedCompoundToken } from './list-style-contract';

/** Named theme radii + numeric px + explicit lengths → full `blur(...)` for filter / backdrop-filter */
function resolveBlurFilterFunction(value: string): string {
  if (value === "none") return "blur(0)";
  const map = tokenValues.filters.blur as Record<string, string>;
  const preset = map[value];
  if (preset !== undefined) return `blur(${preset})`;
  // TW-style numeric suffix: blur-4 / backdrop-blur-12 → blur(Npx)
  if (/^\d+(\.\d+)?$/.test(value)) return `blur(${value}px)`;
  if (/^\d+(\.\d+)?(px|rem|em|%|vh|vw|vmin|vmax)$/i.test(value)) return `blur(${value})`;
  return `blur(${value})`;
}

/** Numeric rem radii: rounded-0.25 / rounded-1 / rounded-5 (Avatar + Alert scale). */
function resolveNumericBorderRadius(value: string): string | null {
  if (!/^\d+(\.\d+)?$/.test(value)) return null;
  return `${value}rem`;
}

/**
 * Theme-aware border-radius values. Named scales emit `var(--iui-border-radius-*)` so
 * compile-first `:root` tokens stay in sync; bare `rounded` uses `--iui-global-radius`.
 */
function resolveBorderRadiusCSSValue(value: string): string | null {
  if (value === "default") {
    return "var(--iui-global-radius, 0.25rem)";
  }
  const staticValue =
    tokenValues.borderRadius[value as keyof typeof tokenValues.borderRadius];
  if (staticValue !== undefined) {
    return `var(--iui-border-radius-${value}, ${staticValue})`;
  }
  return resolveNumericBorderRadius(value);
}

/** Tailwind v4–aligned container widths for `columns-*` / `column-width-*` presets */
function resolveColumnThemeWidth(value: string): string | null {
  const containerExtra: Record<string, string> = {
    '3xs': '16rem',
    '2xs': '18rem'
  };
  if (containerExtra[value]) return containerExtra[value];
  const fromMaxWidth = tokenValues.maxWidth[value as keyof typeof tokenValues.maxWidth];
  if (typeof fromMaxWidth === 'string') return fromMaxWidth;
  return null;
}

/** Angle string inside rotate(...) / rotateX(...) / rotateY(...) — token scale + numeric fallback */
function resolveRotateAngleCss(value: string): string | null {
  const { isNegative, absoluteValue } = parseNegativeValue(value);
  const rotateVal = (rotate as any)[absoluteValue];
  if (rotateVal != null) {
    const finalValue = isNegative ? `-${String(rotateVal).replace('-', '')}` : rotateVal;
    return finalValue;
  }
  const num = parseFloat(absoluteValue);
  if (!isNaN(num) && isFinite(num)) {
    const deg = isNegative ? -num : num;
    return `${deg}deg`;
  }
  return null;
}

export const VALUE_GETTERS: Partial<Record<TokenCategory, ((value: string, opacity?: string) => string | null) | ((value: string) => string | null)>> = {
  // Color utilities - optimized with factory function (support opacity parameter)
  'text-color': createColorValueGetter() as (value: string, opacity?: string) => string | null,
  'bg-color': createColorValueGetter() as (value: string, opacity?: string) => string | null,
  'border-color': createColorValueGetter() as (value: string, opacity?: string) => string | null,
  'border-t-color': createColorValueGetter() as (value: string, opacity?: string) => string | null,
  'border-b-color': createColorValueGetter() as (value: string, opacity?: string) => string | null,
  'border-x-color': createColorValueGetter() as (value: string, opacity?: string) => string | null,
  'border-y-color': createColorValueGetter() as (value: string, opacity?: string) => string | null,
  'border-inline-start-color': createColorValueGetter() as (value: string, opacity?: string) => string | null,
  'border-inline-end-color': createColorValueGetter() as (value: string, opacity?: string) => string | null,
  'border-block-start-color': createColorValueGetter() as (value: string, opacity?: string) => string | null,
  'border-block-end-color': createColorValueGetter() as (value: string, opacity?: string) => string | null,
  'accent-color': createColorValueGetter() as (value: string, opacity?: string) => string | null,
  'caret-color': createColorValueGetter() as (value: string, opacity?: string) => string | null,
  'decoration-color': createColorValueGetter() as (value: string, opacity?: string) => string | null,
  'ring-color': createColorValueGetter() as (value: string, opacity?: string) => string | null,
  'ring-offset-color': createColorValueGetter() as (value: string, opacity?: string) => string | null,
  'outline-color': createColorValueGetter() as (value: string, opacity?: string) => string | null,
  
  // Spacing utilities - smart CSS variable usage with dynamic fallback; margin supports auto (mt-auto, mx-auto)
  'm': (value: string) => (value === 'auto' ? 'auto' : getSmartSpacingValue(value)),
  'mt': (value: string) => (value === 'auto' ? 'auto' : getSmartSpacingValue(value)),
  'me': (value: string) => (value === 'auto' ? 'auto' : getSmartSpacingValue(value)),
  'mb': (value: string) => (value === 'auto' ? 'auto' : getSmartSpacingValue(value)),
  'ms': (value: string) => (value === 'auto' ? 'auto' : getSmartSpacingValue(value)),
  'mbs': (value: string) => (value === 'auto' ? 'auto' : getSmartSpacingValue(value)),
  'mbe': (value: string) => (value === 'auto' ? 'auto' : getSmartSpacingValue(value)),
  'mx': (value: string) => (value === 'auto' ? 'auto' : getSmartSpacingValue(value)),
  'my': (value: string) => (value === 'auto' ? 'auto' : getSmartSpacingValue(value)),
  
  'p': (value: string) => getSmartSpacingValue(value),
  'pt': (value: string) => getSmartSpacingValue(value),
  'pe': (value: string) => getSmartSpacingValue(value),
  'pb': (value: string) => getSmartSpacingValue(value),
  'ps': (value: string) => getSmartSpacingValue(value),
  'pbs': (value: string) => getSmartSpacingValue(value),
  'pbe': (value: string) => getSmartSpacingValue(value),
  'px': (value: string) => getSmartSpacingValue(value),
  'py': (value: string) => getSmartSpacingValue(value),
  
  // Positioning utilities - supports negative values and fractional values
  'top': (value: string) => getSmartPositioningValue(value),
  'end': (value: string) => getSmartPositioningValue(value),
  'bottom': (value: string) => getSmartPositioningValue(value),
  'start': (value: string) => getSmartPositioningValue(value),
  'inset': (value: string) => getSmartPositioningValue(value),
  'z-index': (value: string) => {
    // Handle common z-index values and negative z-index
    const zIndexMap: Record<string, string> = {
      'auto': 'auto',
      '0': '0',
      '10': '10',
      '20': '20',
      '30': '30',
      '40': '40',
      '50': '50',
      '-10': '-10',
      '-20': '-20',
      '-30': '-30',
      '-40': '-40',
      '-50': '-50'
    };
    return zIndexMap[value] || value; // Allow arbitrary z-index values
  },
  
  // Sizing utilities - dynamic calculation with CSS variables and fallbacks
  'width': (value: string) => {
    const special = SPECIAL_VALUES.width[value as keyof typeof SPECIAL_VALUES.width];
    if (special) return special;
    const container = tokenValues.maxWidth[value as keyof typeof tokenValues.maxWidth];
    if (container) return container;
    return getSmartWidthValue(value);
  },
  'height': (value: string) => {
    const special = SPECIAL_VALUES.height[value as keyof typeof SPECIAL_VALUES.height];
    if (special) return special;
    const container = tokenValues.maxHeight[value as keyof typeof tokenValues.maxHeight];
    if (container) return container;
    return getSmartHeightValue(value);
  },
  'size': (value: string) => {
    const special = SPECIAL_VALUES.width[value as keyof typeof SPECIAL_VALUES.width];
    if (special) return special;
    const container = tokenValues.maxWidth[value as keyof typeof tokenValues.maxWidth];
    if (container) return container;
    return getSmartWidthValue(value);
  },
  'min-width': (value: string) => {
    const vw = viewportLengthForMinMaxWidth(value);
    if (vw) return vw;
    const axis = SPECIAL_VALUES.width[value as keyof typeof SPECIAL_VALUES.width];
    if (axis) return axis;
    const container = tokenValues.maxWidth[value as keyof typeof tokenValues.maxWidth];
    if (container) return container;
    const sizing = SPECIAL_VALUES.sizing[value as keyof typeof SPECIAL_VALUES.sizing];
    if (sizing) return sizing;
    return getSmartWidthValue(value) || null;
  },
  'min-height': (value: string) => {
    const vh = viewportLengthForMinMaxHeight(value);
    if (vh) return vh;
    const axis = SPECIAL_VALUES.height[value as keyof typeof SPECIAL_VALUES.height];
    if (axis) return axis;
    const container = tokenValues.maxHeight[value as keyof typeof tokenValues.maxHeight];
    if (container) return container;
    const sizing = SPECIAL_VALUES.sizing[value as keyof typeof SPECIAL_VALUES.sizing];
    if (sizing) return sizing;
    return getSmartHeightValue(value) || null;
  },
  'max-width': (value: string) => {
    const vw = viewportLengthForMinMaxWidth(value);
    if (vw) return vw;
    const special = SPECIAL_VALUES.maxWidth[value as keyof typeof SPECIAL_VALUES.maxWidth];
    if (special) return special;
    const token = tokenValues.maxWidth[value as keyof typeof tokenValues.maxWidth];
    if (token) return token;
    return getSmartWidthValue(value);
  },
  'max-height': (value: string) => {
    const vh = viewportLengthForMinMaxHeight(value);
    if (vh) return vh;
    const special = SPECIAL_VALUES.maxHeight[value as keyof typeof SPECIAL_VALUES.maxHeight];
    if (special) return special;
    const token = tokenValues.maxHeight[value as keyof typeof tokenValues.maxHeight];
    if (token) return token;
    return getSmartHeightValue(value);
  },
  'inline-size': (value: string) => {
    const special = SPECIAL_VALUES.width[value as keyof typeof SPECIAL_VALUES.width];
    if (special) return special;
    const container = tokenValues.maxWidth[value as keyof typeof tokenValues.maxWidth];
    if (container) return container;
    return getSmartWidthValue(value);
  },
  'min-inline-size': (value: string) => {
    const vw = viewportLengthForMinMaxWidth(value);
    if (vw) return vw;
    const axis = SPECIAL_VALUES.width[value as keyof typeof SPECIAL_VALUES.width];
    if (axis) return axis;
    const container = tokenValues.maxWidth[value as keyof typeof tokenValues.maxWidth];
    if (container) return container;
    const sizing = SPECIAL_VALUES.sizing[value as keyof typeof SPECIAL_VALUES.sizing];
    if (sizing) return sizing;
    return getSmartWidthValue(value) || null;
  },
  'max-inline-size': (value: string) => {
    const vw = viewportLengthForMinMaxWidth(value);
    if (vw) return vw;
    const special = SPECIAL_VALUES.maxWidth[value as keyof typeof SPECIAL_VALUES.maxWidth];
    if (special) return special;
    const token = tokenValues.maxWidth[value as keyof typeof tokenValues.maxWidth];
    if (token) return token;
    return getSmartWidthValue(value);
  },
  'block-size': (value: string) => {
    const special = SPECIAL_VALUES.height[value as keyof typeof SPECIAL_VALUES.height];
    if (special) return special;
    const container = tokenValues.maxHeight[value as keyof typeof tokenValues.maxHeight];
    if (container) return container;
    return getSmartHeightValue(value);
  },
  'min-block-size': (value: string) => {
    const vh = viewportLengthForMinMaxHeight(value);
    if (vh) return vh;
    const axis = SPECIAL_VALUES.height[value as keyof typeof SPECIAL_VALUES.height];
    if (axis) return axis;
    const container = tokenValues.maxHeight[value as keyof typeof tokenValues.maxHeight];
    if (container) return container;
    const sizing = SPECIAL_VALUES.sizing[value as keyof typeof SPECIAL_VALUES.sizing];
    if (sizing) return sizing;
    return getSmartHeightValue(value) || null;
  },
  'max-block-size': (value: string) => {
    const vh = viewportLengthForMinMaxHeight(value);
    if (vh) return vh;
    const special = SPECIAL_VALUES.maxHeight[value as keyof typeof SPECIAL_VALUES.maxHeight];
    if (special) return special;
    const token = tokenValues.maxHeight[value as keyof typeof tokenValues.maxHeight];
    if (token) return token;
    return getSmartHeightValue(value);
  },
  'font-stretch': (value: string) => {
    const map: Record<string, string> = {
      'ultra-condensed': 'ultra-condensed',
      'extra-condensed': 'extra-condensed',
      'condensed': 'condensed',
      'semi-condensed': 'semi-condensed',
      'normal': 'normal',
      'semi-expanded': 'semi-expanded',
      'expanded': 'expanded',
      'extra-expanded': 'extra-expanded',
      'ultra-expanded': 'ultra-expanded',
      // Tailwind v4 percentage scale
      '50%': '50%',
      '75%': '75%',
      '90%': '90%',
      '95%': '95%',
      '100%': '100%',
      '105%': '105%',
      '110%': '110%',
      '125%': '125%',
      '150%': '150%',
      '200%': '200%',
    };
    if (map[value]) return map[value];
    if (/^\d+(\.\d+)?%$/.test(value)) return value;
    return null;
  },

  // Typography utilities - check CSS variables first, then fallback to tokens
  'font-size': (value: string) => {
    // First check static tokens (xs, sm, base, etc.) - these are arrays with [size, { lineHeight }]
    const sizeValue = tokenValues.fontSize[value as keyof typeof tokenValues.fontSize];
    if (sizeValue) {
      const fallback = Array.isArray(sizeValue) ? sizeValue[0] as string : null;
      return fallback ? `var(--iui-font-size-${value}, ${fallback})` : null;
    }
    // Use dynamic token system for numeric values (e.g. text-1, text-2) with 4px increment
    const dynamicValue = getFontSizeValue(value);
    return dynamicValue;
  },
  'font-weight': (value: string) => {
    const fallback = tokenValues.fontWeight[value as keyof typeof tokenValues.fontWeight];
    if (fallback) return `var(--iui-font-weight-${value}, ${fallback})`;
    // Tailwind: font-100 … font-900 (numeric, same rule as isTailwindFontWeightNumeric)
    if (isTailwindFontWeightNumeric(value)) return value;
    return null;
  },
  'font-feature-settings': (value: string) => {
    const presets: Record<string, string> = {
      normal: 'normal',
      inherit: 'inherit',
      initial: 'initial',
      revert: 'revert',
      'revert-layer': 'revert-layer',
      liga: '"liga" 1',
      'liga-off': '"liga" 0',
      kern: '"kern" 1',
      'kern-off': '"kern" 0',
      smcp: '"smcp" 1',
      onum: '"onum" 1',
      tnum: '"tnum" 1',
      pnum: '"pnum" 1',
      lnum: '"lnum" 1',
      dlig: '"dlig" 1',
      salt: '"salt" 1',
      ss01: '"ss01" 1',
      ss02: '"ss02" 1',
      cv01: '"cv01" 1',
      cv02: '"cv02" 1',
      frac: '"frac" 1',
      zero: '"zero" 1',
      ordn: '"ordn" 1',
      sinf: '"sinf" 1',
      swsh: '"swsh" 1',
      hist: '"hist" 1',
      aalt: '"aalt" 1',
      case: '"case" 1',
    };
    if (presets[value]) return presets[value];
    return null;
  },
  'font-family': (value: string) => {
    let family: string | readonly string[] | null =
      tokenValues.fontFamily[value as keyof typeof tokenValues.fontFamily];
    if (family) {
      const fallback = Array.isArray(family) ? family.join(", ") : family;
      return `var(--iui-font-family-${value}, ${fallback})`;
    }
    family = typographyExtendTokens[value as keyof typeof typographyExtendTokens] || null;
    if (family) {
      const customFallback = Array.isArray(family) ? family.join(", ") : family;
      return `var(--iui-font-family-${value}, ${customFallback})`;
    }
    return null;
  },
  'line-height': (value: string) => {
    const token = tokenValues.lineHeight[value as keyof typeof tokenValues.lineHeight];
    if (token) return token;
    const num = parseFloat(value);
    if (!isNaN(num) && isFinite(num) && num > 0) {
      if (Number.isInteger(num) && num >= 3) return `${num * 0.25}rem`;
      return String(num);
    }
    return null;
  },
  'letter-spacing': (value: string) => tokenValues.letterSpacing[value as keyof typeof tokenValues.letterSpacing] || null,
  'text-align': (value: string) => value,
  'text-decoration': (value: string) => {
    const values: Record<string, string> = {
      'underline': 'underline',
      'line-through': 'line-through',
      'no-underline': 'none',
      'overline': 'overline'
    };
    return values[value] || value;
  },
  'text-decoration-style': (value: string) => tokenValues.textDecorationStyle[value as keyof typeof tokenValues.textDecorationStyle] || value,
  'text-decoration-thickness': (value: string) => {
    const staticValue = tokenValues.textDecorationThickness[value as keyof typeof tokenValues.textDecorationThickness];
    if (staticValue) return staticValue;
    // Support dynamic pixel values
    const num = parseFloat(value);
    if (!isNaN(num) && isFinite(num) && num >= 0) {
      return `${num}px`;
    }
    return value; // Allow arbitrary values like 'auto', 'from-font'
  },
  'text-underline-offset': (value: string) => {
    const staticValue = tokenValues.textUnderlineOffset[value as keyof typeof tokenValues.textUnderlineOffset];
    if (staticValue) return staticValue;
    // Support dynamic pixel values
    const num = parseFloat(value);
    if (!isNaN(num) && isFinite(num) && num >= 0) {
      return `${num}px`;
    }
    return value; // Allow arbitrary values
  },
  'text-transform': (value: string) => {
    // text-transform-sentencecase: UtilityBuilder (lowercase + ::first-letter uppercase)
    if (value === 'text-transform-sentencecase') return null;
    const values: Record<string, string> = {
      'text-transform-none': 'none',
      'text-transform-uppercase': 'uppercase',
      'text-transform-lowercase': 'lowercase',
      'text-transform-capitalize': 'capitalize',
    };
    return values[value] ?? null;
  },
  'text-overflow': (value: string) => value,
  'text-indent': (value: string) => getSmartSpacingValue(value),
  'vertical-align': (value: string) => tokenValues.verticalAlign[value as keyof typeof tokenValues.verticalAlign] || value,
  'whitespace': (value: string) => tokenValues.whitespace[value as keyof typeof tokenValues.whitespace] || value,
  'word-break': (value: string) => {
    const values: Record<string, string> = {
      'break-all': 'break-all',
      'break-normal': 'normal',
      'keep-all': 'keep-all',
    };
    return values[value] || null;
  },
  'overflow-wrap': (value: string) => {
    const values: Record<string, string> = {
      'break-word': 'break-word',
      anywhere: 'anywhere',
      normal: 'normal',
    };
    return values[value] || null;
  },
  // Prefer parser parsedProperties; these satisfy fallback single-property paths
  'font-smoothing': (value: string) =>
    value === 'antialiased'
      ? 'antialiased'
      : value === 'subpixel-antialiased'
        ? 'auto'
        : null,
  'list-style-image': (value: string) => (value === 'none' ? 'none' : null),
  'hyphens': (value: string) => tokenValues.hyphens[value as keyof typeof tokenValues.hyphens] || value,
  
  
  // Layout utilities
  'display': (value: string) => tokenValues.display[value as keyof typeof tokenValues.display] || null,
  'none': (_value: string) => 'none',
  'float': (value: string) =>
    value === "start"
      ? "inline-start"
      : value === "end"
        ? "inline-end"
        : value === "none"
          ? "none"
          : value,
  'clear': (value: string) =>
    value === "start"
      ? "inline-start"
      : value === "end"
        ? "inline-end"
        : value === "both"
          ? "both"
          : value === "none"
            ? "none"
            : value,
  'position': (value: string) => tokenValues.position[value as keyof typeof tokenValues.position] || null,
  'position-value': (value: string) => tokenValues.position[value as keyof typeof tokenValues.position] || null,
  'overflow': (value: string) => tokenValues.overflow[value as keyof typeof tokenValues.overflow] || null,
  'overflow-x': (value: string) => tokenValues.overflow[value as keyof typeof tokenValues.overflow] || null,
  'overflow-y': (value: string) => tokenValues.overflow[value as keyof typeof tokenValues.overflow] || null,
  'isolation': (value: string) => {
    if (value === "isolate") return "isolate";
    if (value === "isolation-auto") return "auto";
    return null;
  },
  // Tailwind: invisible → visibility: hidden (not the invalid keyword "invisible")
  'visibility': (value: string) => {
    const map: Record<string, string> = {
      visible: 'visible',
      invisible: 'hidden',
      collapse: 'collapse',
    };
    return map[value] || null;
  },
  
  // Box Model utilities
  'box-sizing': (value: string) => tokenValues.boxSizing[value as keyof typeof tokenValues.boxSizing] || null,
  
  // Flexbox utilities
  'flex-direction': (value: string) => tokenValues.flexDirection[value as keyof typeof tokenValues.flexDirection] || null,
  'flex-wrap': (value: string) => tokenValues.flexWrap[value as keyof typeof tokenValues.flexWrap] || null,
  'grow': (value: string) => value,
  'shrink': (value: string) => value,
  'flex': (value: string) => tokenValues.flex[value as keyof typeof tokenValues.flex] || null,
  'flex-grow': (value: string) => {
    const values: Record<string, string> = {
      'grow': '1',
      'grow-0': '0'
    };
    if (values[value]) return values[value];
    const token = tokenValues.flexGrow[value as unknown as keyof typeof tokenValues.flexGrow];
    if (token) return token;
    const num = parseFloat(value);
    if (!isNaN(num) && isFinite(num) && num >= 0) return String(num);
    return null;
  },
  'flex-shrink': (value: string) => {
    const values: Record<string, string> = {
      'shrink': '1',
      'shrink-0': '0'
    };
    if (values[value]) return values[value];
    const token = tokenValues.flexShrink[value as unknown as keyof typeof tokenValues.flexShrink];
    if (token) return token;
    const num = parseFloat(value);
    if (!isNaN(num) && isFinite(num) && num >= 0) return String(num);
    return null;
  },
  'flex-basis': (value: string) => {
    if (value === 'auto') return 'auto';
    if (value === 'full') return '100%';
    if (value === '0') return '0px';
    if (value === 'px') return '1px';
    // Named size tokens (Tailwind container/max-width scale)
    const namedSizes: Record<string, string> = {
      'xs':  '20rem',   // 320px
      'sm':  '24rem',   // 384px
      'md':  '28rem',   // 448px
      'lg':  '32rem',   // 512px
      'xl':  '36rem',   // 576px
      '2xl': '42rem',   // 672px
      '3xl': '48rem',   // 768px
      '4xl': '56rem',   // 896px
      '5xl': '64rem',   // 1024px
      '6xl': '72rem',   // 1152px
      '7xl': '80rem',   // 1280px
    };
    if (namedSizes[value]) return namedSizes[value];
    // Fraction tokens → percentage (e.g. 1/2 → 50%)
    if (value.includes('/')) {
      const staticVal = tokenValues.spacing[value as keyof typeof tokenValues.spacing];
      return staticVal ?? value;
    }
    // Same spacing scale as width/height (open numerics + theme tokens)
    return getSmartSpacingValue(value) ?? getSmartWidthValue(value);
  },
  'justify-content': (value: string) => tokenValues.justifyContent[value as keyof typeof tokenValues.justifyContent] || null,
  'justify-items': (value: string) => tokenValues.justifyItems[value as keyof typeof tokenValues.justifyItems] || null,
  'justify-self': (value: string) => tokenValues.justifySelf[value as keyof typeof tokenValues.justifySelf] || null,
  'align-content': (value: string) => tokenValues.alignContent[value as keyof typeof tokenValues.alignContent] || null,
  'align-items': (value: string) => tokenValues.alignItems[value as keyof typeof tokenValues.alignItems] || null,
  'align-self': (value: string) => tokenValues.alignSelf[value as keyof typeof tokenValues.alignSelf] || null,
  'place-content': (value: string) => tokenValues.placeContent[value as keyof typeof tokenValues.placeContent] || null,
  'place-items': (value: string) => tokenValues.placeItems[value as keyof typeof tokenValues.placeItems] || null,
  'place-self': (value: string) => tokenValues.placeSelf[value as keyof typeof tokenValues.placeSelf] || null,
  'gap': (value: string) => resolveGapSpacingValue(value),
  'gap-x': (value: string) => resolveGapSpacingValue(value),
  'gap-y': (value: string) => resolveGapSpacingValue(value),

  // Grid
  'grid-template-columns': (value: string) => {
    const token = tokenValues.gridTemplateColumns[value as keyof typeof tokenValues.gridTemplateColumns];
    if (token) return token;
    const n = parseInt(value, 10);
    if (!isNaN(n) && n > 0 && n < 1000) return `repeat(${n}, minmax(0, 1fr))`;
    return null;
  },
  'grid-template-rows': (value: string) => {
    const token = tokenValues.gridTemplateRows[value as keyof typeof tokenValues.gridTemplateRows];
    if (token) return token;
    const n = parseInt(value, 10);
    if (!isNaN(n) && n > 0 && n < 1000) return `repeat(${n}, minmax(0, 1fr))`;
    return null;
  },
  'grid-column-start': (value: string) => {
    return tokenValues.gridColumnStart[value as keyof typeof tokenValues.gridColumnStart] || null;
  },
  'grid-column-end': (value: string) => {
    return tokenValues.gridColumnEnd[value as keyof typeof tokenValues.gridColumnEnd] || null;
  },
  'grid-row-start': (value: string) => {
    return tokenValues.gridRowStart[value as keyof typeof tokenValues.gridRowStart] || null;
  },
  'grid-row-end': (value: string) => {
    return tokenValues.gridRowEnd[value as keyof typeof tokenValues.gridRowEnd] || null;
  },
  'grid-auto-flow': (value: string) => {
    const values: Record<string, string> = {
      'row': 'row',
      'col': 'column',
      'column': 'column',
      'row-dense': 'row dense',
      'col-dense': 'column dense',
      'dense': 'dense',
    };
    return values[value] ?? null;
  },
  'grid-auto-columns': (value: string) => {
    const track: Record<string, string> = {
      auto: 'auto',
      min: 'minmax(0, min-content)',
      max: 'minmax(0, max-content)',
      fr: 'minmax(0, 1fr)',
    };
    if (track[value]) return track[value];
    return getSmartSpacingValue(value) ?? null;
  },
  'grid-auto-rows': (value: string) => {
    const track: Record<string, string> = {
      auto: 'auto',
      min: 'minmax(0, min-content)',
      max: 'minmax(0, max-content)',
      fr: 'minmax(0, 1fr)',
    };
    if (track[value]) return track[value];
    return getSmartSpacingValue(value) ?? null;
  },
  'order': (value: string) => {
    // Check token values first for numeric values
    const tokenValue = tokenValues.order[value as keyof typeof tokenValues.order];
    if (tokenValue) {
      return tokenValue;
    }
    
    // Handle special values
    const orderValues: Record<string, string> = {
      'first': '-9999',
      'last': '9999',
      'none': '0'
    };
    return orderValues[value] || value;
  },
  
  // Effects
  'box-shadow': (value: string) => tokenValues.boxShadow[value as keyof typeof tokenValues.boxShadow] || null,
  'shadow-color': (value: string) => {
    // For shadow colors, use CSS variable
    const cssVar = `var(--iui-color-${value})`;
    return cssVar;
  },
  'shadow-t': (value: string) => {
    // Top shadow with specific offsets
    const shadowMap: Record<string, string> = {
      'none': 'none',
      '2xs': '0 -1px 2px 0 var(--iui-shadow-t-color, var(--iui-shadow-color, rgba(0, 0, 0, 0.05)))',
      'xs': '0 -1px 2px 0 var(--iui-shadow-t-color, var(--iui-shadow-color, rgba(0, 0, 0, 0.05)))',
      'sm': '0 -1px 2px 0 var(--iui-shadow-t-color, var(--iui-shadow-color, rgba(0, 0, 0, 0.05)))',
      'md': '0 -4px 6px -1px var(--iui-shadow-t-color, var(--iui-shadow-color, rgba(0, 0, 0, 0.1)))',
      'lg': '0 -10px 15px -3px var(--iui-shadow-t-color, var(--iui-shadow-color, rgba(0, 0, 0, 0.1)))',
      'xl': '0 -20px 25px -5px var(--iui-shadow-t-color, var(--iui-shadow-color, rgba(0, 0, 0, 0.1)))',
      '2xl': '0 -25px 50px -12px var(--iui-shadow-t-color, var(--iui-shadow-color, rgba(0, 0, 0, 0.25)))',
    };
    return shadowMap[value] || null;
  },
  'shadow-e': (value: string) => {
    // Inline-end shadow (positive horizontal offset; flips with writing mode in LTR)
    const shadowMap: Record<string, string> = {
      'none': 'none',
      '2xs': '1px 0 2px 0 var(--iui-shadow-e-color, var(--iui-shadow-color, rgba(0, 0, 0, 0.05)))',
      'xs': '1px 0 2px 0 var(--iui-shadow-e-color, var(--iui-shadow-color, rgba(0, 0, 0, 0.05)))',
      'sm': '1px 0 2px 0 var(--iui-shadow-e-color, var(--iui-shadow-color, rgba(0, 0, 0, 0.05)))',
      'md': '4px 0 6px -1px var(--iui-shadow-e-color, var(--iui-shadow-color, rgba(0, 0, 0, 0.1)))',
      'lg': '10px 0 15px -3px var(--iui-shadow-e-color, var(--iui-shadow-color, rgba(0, 0, 0, 0.1)))',
      'xl': '20px 0 25px -5px var(--iui-shadow-e-color, var(--iui-shadow-color, rgba(0, 0, 0, 0.1)))',
      '2xl': '25px 0 50px -12px var(--iui-shadow-e-color, var(--iui-shadow-color, rgba(0, 0, 0, 0.25)))',
    };
    return shadowMap[value] || null;
  },
  'shadow-b': (value: string) => {
    // Bottom shadow with specific offsets
    const shadowMap: Record<string, string> = {
      'none': 'none',
      '2xs': '0 1px 2px 0 var(--iui-shadow-b-color, var(--iui-shadow-color, rgba(0, 0, 0, 0.05)))',
      'xs': '0 1px 2px 0 var(--iui-shadow-b-color, var(--iui-shadow-color, rgba(0, 0, 0, 0.05)))',
      'sm': '0 1px 2px 0 var(--iui-shadow-b-color, var(--iui-shadow-color, rgba(0, 0, 0, 0.05)))',
      'md': '0 4px 6px -1px var(--iui-shadow-b-color, var(--iui-shadow-color, rgba(0, 0, 0, 0.1)))',
      'lg': '0 10px 15px -3px var(--iui-shadow-b-color, var(--iui-shadow-color, rgba(0, 0, 0, 0.1)))',
      'xl': '0 20px 25px -5px var(--iui-shadow-b-color, var(--iui-shadow-color, rgba(0, 0, 0, 0.1)))',
      '2xl': '0 25px 50px -12px var(--iui-shadow-b-color, var(--iui-shadow-color, rgba(0, 0, 0, 0.25)))',
    };
    return shadowMap[value] || null;
  },
  'shadow-s': (value: string) => {
    // Inline-start shadow (negative horizontal offset)
    const shadowMap: Record<string, string> = {
      'none': 'none',
      '2xs': '-1px 0 2px 0 var(--iui-shadow-s-color, var(--iui-shadow-color, rgba(0, 0, 0, 0.05)))',
      'xs': '-1px 0 2px 0 var(--iui-shadow-s-color, var(--iui-shadow-color, rgba(0, 0, 0, 0.05)))',
      'sm': '-1px 0 2px 0 var(--iui-shadow-s-color, var(--iui-shadow-color, rgba(0, 0, 0, 0.05)))',
      'md': '-4px 0 6px -1px var(--iui-shadow-s-color, var(--iui-shadow-color, rgba(0, 0, 0, 0.1)))',
      'lg': '-10px 0 15px -3px var(--iui-shadow-s-color, var(--iui-shadow-color, rgba(0, 0, 0, 0.1)))',
      'xl': '-20px 0 25px -5px var(--iui-shadow-s-color, var(--iui-shadow-color, rgba(0, 0, 0, 0.1)))',
      '2xl': '-25px 0 50px -12px var(--iui-shadow-s-color, var(--iui-shadow-color, rgba(0, 0, 0, 0.25)))',
    };
    return shadowMap[value] || null;
  },
  'shadow-t-color': (value: string) => {
    const cssVar = `var(--iui-color-${value})`;
    return cssVar;
  },
  'shadow-e-color': (value: string) => {
    const cssVar = `var(--iui-color-${value})`;
    return cssVar;
  },
  'shadow-b-color': (value: string) => {
    const cssVar = `var(--iui-color-${value})`;
    return cssVar;
  },
  'shadow-s-color': (value: string) => {
    const cssVar = `var(--iui-color-${value})`;
    return cssVar;
  },
  'opacity': (value: string) => {
    const token = tokenValues.opacity[value as keyof typeof tokenValues.opacity];
    if (token) return token;
    const num = parseFloat(value);
    if (!isNaN(num) && isFinite(num)) {
      if (num >= 0 && num <= 1) return String(num);
      if (num >= 0 && num <= 100) return String(num / 100);
    }
    return null;
  },
  
  // Borders - dynamic calculation with CSS variables and fallbacks
  'border-width': (value: string) => {
    if (value === 'default') return '1px';
    const dynamicValue = getBorderWidthValue(value);
    return dynamicValue || `${value}px`;
  },
  'border-t-width': (value: string) => {
    if (value === 'default') return '1px';
    const dynamicValue = getBorderWidthValue(value);
    return dynamicValue || `${value}px`;
  },
  'border-b-width': (value: string) => {
    if (value === 'default') return '1px';
    const dynamicValue = getBorderWidthValue(value);
    return dynamicValue || `${value}px`;
  },
  'border-x-width': (value: string) => {
    if (value === 'default') return '1px';
    const dynamicValue = getBorderWidthValue(value);
    return dynamicValue || `${value}px`;
  },
  'border-y-width': (value: string) => {
    if (value === 'default') return '1px';
    const dynamicValue = getBorderWidthValue(value);
    return dynamicValue || `${value}px`;
  },
  'border-s-width': (value: string) => {
    if (value === 'default') return '1px';
    const dynamicValue = getBorderWidthValue(value);
    return dynamicValue || `${value}px`;
  },
  'border-e-width': (value: string) => {
    if (value === 'default') return '1px';
    const dynamicValue = getBorderWidthValue(value);
    return dynamicValue || `${value}px`;
  },
  'border-bs-width': (value: string) => {
    if (value === 'default') return '1px';
    const dynamicValue = getBorderWidthValue(value);
    return dynamicValue || `${value}px`;
  },
  'border-be-width': (value: string) => {
    if (value === 'default') return '1px';
    const dynamicValue = getBorderWidthValue(value);
    return dynamicValue || `${value}px`;
  },
  'border-style': (value: string) => tokenValues.borderStyle[value as keyof typeof tokenValues.borderStyle] || null,
  'border-t-style': (value: string) => tokenValues.borderStyle[value as keyof typeof tokenValues.borderStyle] || null,
  'border-b-style': (value: string) => tokenValues.borderStyle[value as keyof typeof tokenValues.borderStyle] || null,
  'border-x-style': (value: string) => tokenValues.borderStyle[value as keyof typeof tokenValues.borderStyle] || null,
  'border-y-style': (value: string) => tokenValues.borderStyle[value as keyof typeof tokenValues.borderStyle] || null,
  'border-s-style': (value: string) => tokenValues.borderStyle[value as keyof typeof tokenValues.borderStyle] || null,
  'border-e-style': (value: string) => tokenValues.borderStyle[value as keyof typeof tokenValues.borderStyle] || null,
  'border-bs-style': (value: string) => tokenValues.borderStyle[value as keyof typeof tokenValues.borderStyle] || null,
  'border-be-style': (value: string) => tokenValues.borderStyle[value as keyof typeof tokenValues.borderStyle] || null,
  'border-radius': (value: string) => resolveBorderRadiusCSSValue(value),
  'border-radius-t': (value: string) => resolveBorderRadiusCSSValue(value),
  'border-radius-b': (value: string) => resolveBorderRadiusCSSValue(value),
  'border-radius-ts': (value: string) => resolveBorderRadiusCSSValue(value),
  'border-radius-te': (value: string) => resolveBorderRadiusCSSValue(value),
  'border-radius-be': (value: string) => resolveBorderRadiusCSSValue(value),
  'border-radius-bs': (value: string) => resolveBorderRadiusCSSValue(value),
  'border-radius-s': (value: string) => resolveBorderRadiusCSSValue(value),
  'border-radius-e': (value: string) => resolveBorderRadiusCSSValue(value),
  'border-radius-ss': (value: string) => resolveBorderRadiusCSSValue(value),
  'border-radius-se': (value: string) => resolveBorderRadiusCSSValue(value),
  'border-radius-es': (value: string) => resolveBorderRadiusCSSValue(value),
  'border-radius-ee': (value: string) => resolveBorderRadiusCSSValue(value),
  
  // Transforms (static tokens + numeric/decimal fallback where it makes sense)
  'scale': (value: string) => {
    const { isNegative, absoluteValue } = parseNegativeValue(value);
    const scaleVal = (scale as any)[absoluteValue];
    if (scaleVal != null) {
      const finalValue = isNegative ? `-${String(scaleVal).replace('-', '')}` : scaleVal;
      return `scale(${finalValue})`;
    }
    const num = parseFloat(absoluteValue);
    if (!isNaN(num) && isFinite(num)) {
      // Integer (e.g. 75) -> percentage 0.75; decimal (e.g. 1.25) -> direct
      const scaleNum = absoluteValue.includes('.') ? num : num / 100;
      const finalValue = isNegative ? -scaleNum : scaleNum;
      return `scale(${finalValue})`;
    }
    return null;
  },
  'scale-x': (value: string) => {
    const { isNegative, absoluteValue } = parseNegativeValue(value);
    const scaleVal = (scale as any)[absoluteValue];
    if (scaleVal != null) {
      const finalValue = isNegative ? `-${String(scaleVal).replace('-', '')}` : scaleVal;
      return `scaleX(${finalValue})`;
    }
    const num = parseFloat(absoluteValue);
    if (!isNaN(num) && isFinite(num)) {
      const scaleNum = absoluteValue.includes('.') ? num : num / 100;
      const finalValue = isNegative ? -scaleNum : scaleNum;
      return `scaleX(${finalValue})`;
    }
    return null;
  },
  'scale-y': (value: string) => {
    const { isNegative, absoluteValue } = parseNegativeValue(value);
    const scaleVal = (scale as any)[absoluteValue];
    if (scaleVal != null) {
      const finalValue = isNegative ? `-${String(scaleVal).replace('-', '')}` : scaleVal;
      return `scaleY(${finalValue})`;
    }
    const num = parseFloat(absoluteValue);
    if (!isNaN(num) && isFinite(num)) {
      const scaleNum = absoluteValue.includes('.') ? num : num / 100;
      const finalValue = isNegative ? -scaleNum : scaleNum;
      return `scaleY(${finalValue})`;
    }
    return null;
  },
  'rotate': (value: string) => {
    const angle = resolveRotateAngleCss(value);
    return angle != null ? `rotate(${angle})` : null;
  },
  'rotate-x': (value: string) => {
    const angle = resolveRotateAngleCss(value);
    return angle != null ? `rotateX(${angle})` : null;
  },
  'rotate-y': (value: string) => {
    const angle = resolveRotateAngleCss(value);
    return angle != null ? `rotateY(${angle})` : null;
  },
  'translate-x': (value: string) => {
    const { isNegative, absoluteValue } = parseNegativeValue(value);
    
    // Check static translate tokens first
    const translateVal = translate[absoluteValue as keyof typeof translate];
    if (translateVal) {
      // For fractional values (1/2, 1/4, etc.) and percentages, handle negative properly
      if (absoluteValue.includes('/') || translateVal.includes('%')) {
        return isNegative ? `translateX(calc(-1 * ${translateVal}))` : `translateX(${translateVal})`;
      }
      // For rem/px values with decimals, use direct negative
      if (absoluteValue.includes('.')) {
        return isNegative ? `translateX(-${translateVal.replace('-', '')})` : `translateX(${translateVal})`;
      }
      // For integer values
      return isNegative ? `translateX(-${translateVal.replace('-', '')})` : `translateX(${translateVal})`;
    }
    
    // Try dynamic calculation for numeric values not in static tokens
    if (!absoluteValue.includes('/') && !absoluteValue.includes('%')) {
      const computedValue = getSpacingValue(absoluteValue);
      if (computedValue) {
        return isNegative ? `translateX(-${computedValue})` : `translateX(${computedValue})`;
      }
    }
    
    return null;
  },
  'translate-y': (value: string) => {
    const { isNegative, absoluteValue } = parseNegativeValue(value);
    
    // Check static translate tokens first
    const translateVal = translate[absoluteValue as keyof typeof translate];
    if (translateVal) {
      // For fractional values (1/2, 1/4, etc.) and percentages, handle negative properly
      if (absoluteValue.includes('/') || translateVal.includes('%')) {
        return isNegative ? `translateY(calc(-1 * ${translateVal}))` : `translateY(${translateVal})`;
      }
      // For rem/px values with decimals, use direct negative
      if (absoluteValue.includes('.')) {
        return isNegative ? `translateY(-${translateVal.replace('-', '')})` : `translateY(${translateVal})`;
      }
      // For integer values
      return isNegative ? `translateY(-${translateVal.replace('-', '')})` : `translateY(${translateVal})`;
    }
    
    // Try dynamic calculation for numeric values not in static tokens
    if (!absoluteValue.includes('/') && !absoluteValue.includes('%')) {
      const computedValue = getSpacingValue(absoluteValue);
      if (computedValue) {
        return isNegative ? `translateY(-${computedValue})` : `translateY(${computedValue})`;
      }
    }
    
    return null;
  },
  'skew-x': (value: string) => {
    const { isNegative, absoluteValue } = parseNegativeValue(value);
    const skewVal = (skew as any)[absoluteValue];
    if (skewVal != null) {
      const finalValue = isNegative ? `-${String(skewVal).replace('-', '')}` : skewVal;
      return `skewX(${finalValue})`;
    }
    const num = parseFloat(absoluteValue);
    if (!isNaN(num) && isFinite(num)) {
      const deg = isNegative ? -num : num;
      return `skewX(${deg}deg)`;
    }
    return null;
  },
  'skew-y': (value: string) => {
    const { isNegative, absoluteValue } = parseNegativeValue(value);
    const skewVal = (skew as any)[absoluteValue];
    if (skewVal != null) {
      const finalValue = isNegative ? `-${String(skewVal).replace('-', '')}` : skewVal;
      return `skewY(${finalValue})`;
    }
    const num = parseFloat(absoluteValue);
    if (!isNaN(num) && isFinite(num)) {
      const deg = isNegative ? -num : num;
      return `skewY(${deg}deg)`;
    }
    return null;
  },
  'transform-origin': (value: string) => {
    const values: Record<string, string> = {
      'center': 'center',
      'top': 'top',
      'bottom': 'bottom',

      // Logical keywords (preferred in IUI): start/end (direction-aware)
      start: 'var(--iui-inline-start-x, left)',
      end: 'var(--iui-inline-end-x, right)',

      // Logical corners (IUI)
      'top-start': 'var(--iui-inline-start-x, left) top',
      'top-end': 'var(--iui-inline-end-x, right) top',
      'bottom-start': 'var(--iui-inline-start-x, left) bottom',
      'bottom-end': 'var(--iui-inline-end-x, right) bottom',

      // Short corner aliases (IUI)
      ts: 'var(--iui-inline-start-x, left) top',
      te: 'var(--iui-inline-end-x, right) top',
      bs: 'var(--iui-inline-start-x, left) bottom',
      be: 'var(--iui-inline-end-x, right) bottom',
    };
    return values[value] || value; // Allow arbitrary values
  },
  'transform-style': (value: string) => (value === 'flat' || value === 'preserve-3d') ? value : null,
  'backface-visibility': (value: string) => (value === 'visible' || value === 'hidden') ? value : null,
  'perspective': (value: string) => {
    const scaleValue = tokenValues.perspective[value as keyof typeof tokenValues.perspective];
    if (scaleValue !== undefined) return scaleValue; // named (dramatic, near, normal, midrange, distant) + numeric scale
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0) return num + 'px'; // perspective-150 → 150px
    if (/^\d+(\.\d+)?(px|rem|em|vw|vh|vmin|vmax|cm|mm|in|pt|pc|%)$/.test(value)) return value; // Arbitrary with unit
    return null;
  },
  'perspective-origin': (value: string) => {
    const v: Record<string, string> = {
      'center': 'center',
      'top': 'top',
      'bottom': 'bottom',

      // Logical keywords (preferred in IUI): start/end (direction-aware)
      start: 'var(--iui-inline-start-x, left)',
      end: 'var(--iui-inline-end-x, right)',

      // Logical corners (IUI)
      'top-start': 'var(--iui-inline-start-x, left) top',
      'top-end': 'var(--iui-inline-end-x, right) top',
      'bottom-start': 'var(--iui-inline-start-x, left) bottom',
      'bottom-end': 'var(--iui-inline-end-x, right) bottom',

      // Short corner aliases
      ts: 'var(--iui-inline-start-x, left) top',
      te: 'var(--iui-inline-end-x, right) top',
      bs: 'var(--iui-inline-start-x, left) bottom',
      be: 'var(--iui-inline-end-x, right) bottom',
    };
    return v[value] ?? value; // Allow arbitrary (e.g. 50% 25%, left top)
  },
  
  // Transitions
  'transition-property': (value: string) => {
    if (value === 'default') return 'color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter';
    return tokenValues.transitionProperty[value as keyof typeof tokenValues.transitionProperty] || null;
  },
  'transition-duration': (value: string) => {
    const token = tokenValues.transitionDuration[value as unknown as keyof typeof tokenValues.transitionDuration];
    if (token) return token;
    const num = parseFloat(value);
    if (!isNaN(num) && isFinite(num) && num >= 0) return `${num}ms`;
    return null;
  },
  'transition-timing': (value: string) => tokenValues.transitionTimingFunction[value as keyof typeof tokenValues.transitionTimingFunction] || null,
  'transition-delay': (value: string) => {
    const token = tokenValues.transitionDelay[value as unknown as keyof typeof tokenValues.transitionDelay];
    if (token) return token;
    const num = parseFloat(value);
    if (!isNaN(num) && isFinite(num) && num >= 0) return `${num}ms`;
    return null;
  },
  'transition-behavior': (value: string) => (value === 'normal' || value === 'allow-discrete') ? value : null,
  
  // Animation utilities
  'animation': (value: string) => tokenValues.animation[value as keyof typeof tokenValues.animation] || null,
  'animation-duration': (value: string) => {
    const token = tokenValues.animationDuration[value as unknown as keyof typeof tokenValues.animationDuration];
    if (token) return token;
    const num = parseFloat(value);
    if (!isNaN(num) && isFinite(num) && num >= 0) return `${num}ms`;
    return null;
  },
  'animation-delay': (value: string) => {
    const token = tokenValues.animationDelay[value as unknown as keyof typeof tokenValues.animationDelay];
    if (token) return token;
    const num = parseFloat(value);
    if (!isNaN(num) && isFinite(num) && num >= 0) return `${num}ms`;
    return null;
  },
  
  // Animation property utilities
  'animation-iteration-count': (value: string) => {
    if (value === 'infinite') return 'infinite';
    return value;
  },
  'animation-direction': (value: string) => {
    const values: Record<string, string> = {
      'normal': 'normal',
      'reverse': 'reverse',
      'alternate': 'alternate',
      'alternate-reverse': 'alternate-reverse'
    };
    return values[value] || value;
  },
  'animation-fill-mode': (value: string) => {
    const values: Record<string, string> = {
      'none': 'none',
      'forwards': 'forwards',
      'backwards': 'backwards',
      'both': 'both'
    };
    return values[value] || value;
  },
  'animation-play-state': (value: string) => {
    const values: Record<string, string> = {
      'running': 'running',
      'paused': 'paused'
    };
    return values[value] || value;
  },
  'animation-timing-function': (value: string) => tokenValues.transitionTimingFunction[value as keyof typeof tokenValues.transitionTimingFunction] || null,
  
  // Mix blend mode (Tailwind: mix-blend-{value} → value is after prefix)
  'mix-blend-mode': (value: string) => {
    const values: Record<string, string> = {
      'normal': 'normal',
      'multiply': 'multiply',
      'screen': 'screen',
      'overlay': 'overlay',
      'darken': 'darken',
      'lighten': 'lighten',
      'color-dodge': 'color-dodge',
      'color-burn': 'color-burn',
      'hard-light': 'hard-light',
      'soft-light': 'soft-light',
      'difference': 'difference',
      'exclusion': 'exclusion',
      'hue': 'hue',
      'saturation': 'saturation',
      'color': 'color',
      'luminosity': 'luminosity',
      'plus-darker': 'plus-darker',
      'plus-lighter': 'plus-lighter',
    };
    return values[value] ?? value;
  },
  'background-blend-mode': (value: string) => {
    const values: Record<string, string> = {
      'normal': 'normal',
      'multiply': 'multiply',
      'screen': 'screen',
      'overlay': 'overlay',
      'darken': 'darken',
      'lighten': 'lighten',
      'color-dodge': 'color-dodge',
      'color-burn': 'color-burn',
      'hard-light': 'hard-light',
      'soft-light': 'soft-light',
      'difference': 'difference',
      'exclusion': 'exclusion',
      'hue': 'hue',
      'saturation': 'saturation',
      'color': 'color',
      'luminosity': 'luminosity',
    };
    return values[value] || value;
  },
  'text-shadow': (value: string) => tokenValues.textShadow[value as keyof typeof tokenValues.textShadow] ?? value, // Scale from values.ts + arbitrary pass-through
  'mask-clip': (value: string) => {
    const v: Record<string, string> = {
      'none': 'none',
      'no-clip': 'no-clip',
      'border': 'border-box',
      'padding': 'padding-box',
      'content': 'content-box',
      'fill': 'fill-box',
      'stroke': 'stroke-box',
      'view': 'view-box',
      'text': 'text',
    };
    return v[value] ?? value;
  },
  'mask-composite': (value: string) => {
    const v: Record<string, string> = { 'add': 'add', 'subtract': 'subtract', 'intersect': 'intersect', 'exclude': 'exclude' };
    return v[value] ?? value; // Allow arbitrary
  },
  'mask-image': (value: string) => {
    if (value === 'none') return 'none';
    if (value.startsWith('url(') || value.startsWith('linear-gradient') || value.startsWith('radial-gradient') || value.startsWith('image-set(')) return value;
    return value; // Allow arbitrary (url(), gradient, etc.)
  },
  'mask-mode': (value: string) => (value === 'luminance' || value === 'alpha') ? value : null,
  'mask-origin': (value: string) => {
    const v: Record<string, string> = {
      'border': 'border-box',
      'padding': 'padding-box',
      'content': 'content-box',
      'fill': 'fill-box',
      'stroke': 'stroke-box',
      'view': 'view-box',
    };
    return v[value] ?? value;
  },
  'mask-position': (value: string) => {
    const v: Record<string, string> = {
      'center': 'center',
      'top': 'top',
      'bottom': 'bottom',
      'start': 'inline-start',
      'end': 'inline-end',
      'top-start': 'top inline-start',
      'top-end': 'top inline-end',
      'bottom-start': 'bottom inline-start',
      'bottom-end': 'bottom inline-end',
      // Short corner aliases
      ts: 'top inline-start',
      te: 'top inline-end',
      bs: 'bottom inline-start',
      be: 'bottom inline-end',
    };
    return v[value] ?? value;
  },
  'mask-repeat': (value: string) => {
    const v: Record<string, string> = {
      'repeat': 'repeat',
      'no-repeat': 'no-repeat',
      'repeat-x': 'repeat-x',
      'repeat-y': 'repeat-y',
      'space': 'space',
      'round': 'round',
    };
    return v[value] ?? value;
  },
  'mask-size': (value: string) => {
    const v: Record<string, string> = { 'auto': 'auto', 'cover': 'cover', 'contain': 'contain' };
    return v[value] ?? value; // Allow arbitrary (e.g. 100px, 50%, 10rem 5rem)
  },
  'mask-type': (value: string) => (value === 'luminance' || value === 'alpha') ? value : null,
  
  // Interactivity
  'appearance': (value: string) => value,
  'cursor': (value: string) => tokenValues.cursor[value as keyof typeof tokenValues.cursor] || null,
  'outline': (value: string) => {
    if (value === 'focus' || value === 'danger' || value === 'disabled' || value === 'interactive') {
      return '2px solid';
    }
    return null;
  },
  
  // Interactivity utilities
  'pointer-events': (value: string) => {
    const values: Record<string, string> = {
      'none': 'none',
      'auto': 'auto',
      'visible': 'visiblePainted',
      'visible-fill': 'visibleFill',
      'visible-stroke': 'visibleStroke',
      'visible-painted': 'visiblePainted',
      'painted': 'painted',
      'fill': 'fill',
      'stroke': 'stroke',
      'all': 'all'
    };
    return values[value] || null;
  },
  'resize': (value: string) => {
    const values: Record<string, string> = {
      'none': 'none',
      'both': 'both',
      'horizontal': 'horizontal',
      'vertical': 'vertical',
      'block': 'block',
      'inline': 'inline'
    };
    return values[value] || null;
  },
  'select': (value: string) => {
    const values: Record<string, string> = {
      'none': 'none',
      'text': 'text',
      'all': 'all',
      'auto': 'auto'
    };
    return values[value] || null;
  },
  'touch-action': (value: string) => {
    const values: Record<string, string> = {
      'auto': 'auto',
      'none': 'none',
      'pan-x': 'pan-x',
      'pan-left': 'pan-left',
      'pan-right': 'pan-right',
      'pan-y': 'pan-y',
      'pan-up': 'pan-up',
      'pan-down': 'pan-down',
      'pinch-zoom': 'pinch-zoom',
      'manipulation': 'manipulation'
    };
    return values[value] || null;
  },
  'user-select': (value: string) => {
    const values: Record<string, string> = {
      'none': 'none',
      'text': 'text',
      'all': 'all',
      'auto': 'auto'
    };
    return values[value] || null;
  },
  
  // Spacing between children utilities
  'space-x': (value: string) => {
return getSmartSpacingValue(value);
  },
  'space-y': (value: string) => {
return getSmartSpacingValue(value);
  },
  
  // Aspect ratio utilities
  'aspect-ratio': (value: string) => {
    const values: Record<string, string> = {
      'auto': 'auto',
      'square': '1 / 1',
      'video': '16 / 9',
      'landscape': '4 / 3',
      'portrait': '3 / 4',
      'golden': '1.618 / 1',
      'ultrawide': '21 / 9',
      '4/3': '4 / 3',
      '3/2': '3 / 2',
      '5/4': '5 / 4',
      '4/5': '4 / 5',
      '2/3': '2 / 3',
      '3/4': '3 / 4',
      '9/16': '9 / 16'
    };
    if (values[value]) return values[value];
    const slash = value.match(/^(\d+)\/(\d+)$/);
    if (slash) return `${slash[1]} / ${slash[2]}`;
    if (/^\d+(\.\d+)?$/.test(value)) return `${value} / 1`;
    return value;
  },
  
  // Content utilities (Tailwind content-['…'] passes bracket-wrapped value from parser)
  'content': (value: string) => {
    if (value === 'none') return 'none';
    if (value === 'normal') return 'normal';
    const keywords: Record<string, string> = {
      'open-quote': 'open-quote',
      'close-quote': 'close-quote',
      'no-open-quote': 'no-open-quote',
      'no-close-quote': 'no-close-quote',
    };
    if (keywords[value]) return keywords[value];
    const decodeTailwindContentText = (raw: string): string => {
      const escapedUnderscorePlaceholder = '___ESCAPEDUNDERSCORE___';
      const preserved = raw.replace(/\\_/g, escapedUnderscorePlaceholder);
      const withSpaces = preserved.replace(/_/g, ' ');
      return withSpaces.replace(new RegExp(escapedUnderscorePlaceholder, 'g'), '_');
    };

    const sq = value.match(/^\['([^']*)'\]$/);
    if (sq) {
      const decoded = decodeTailwindContentText(sq[1]);
      const inner = decoded.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      return `'${inner}'`;
    }
    const dq = value.match(/^\["([^"]*)"\]$/);
    if (dq) {
      const decoded = decodeTailwindContentText(dq[1]);
      const inner = decoded.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      return `"${inner}"`;
    }
    return value;
  },
  
  // Text wrap utilities
  'text-wrap': (value: string) => {
    const values: Record<string, string> = {
      'wrap': 'wrap',
      'nowrap': 'nowrap',
      'balance': 'balance',
      'pretty': 'pretty'
    };
    return values[value] || null;
  },
  
  // Special utilities - these return null and are handled specially
  'sr-only': () => null,
  'not-sr-only': () => null,
  
  // Filter utilities
  'filter': (value: string) => {
    if (value === 'none') return 'none';
    return value; // Allow arbitrary filter values
  },
  'blur': (value: string) => {
    if (value === 'blur') return 'blur(8px)'; // bare `blur` utility
    return resolveBlurFilterFunction(value);
  },
  'brightness': (value: string) => {
    if (value === '0') return 'brightness(0)';
    if (value === '50') return 'brightness(0.5)';
    if (value === '75') return 'brightness(0.75)';
    if (value === '90') return 'brightness(0.9)';
    if (value === '95') return 'brightness(0.95)';
    if (value === '100') return 'brightness(1)';
    if (value === '105') return 'brightness(1.05)';
    if (value === '110') return 'brightness(1.1)';
    if (value === '125') return 'brightness(1.25)';
    if (value === '150') return 'brightness(1.5)';
    if (value === '200') return 'brightness(2)';
    return `brightness(${value})`;
  },
  'contrast': (value: string) => {
    if (value === '0') return 'contrast(0)';
    if (value === '50') return 'contrast(0.5)';
    if (value === '75') return 'contrast(0.75)';
    if (value === '100') return 'contrast(1)';
    if (value === '125') return 'contrast(1.25)';
    if (value === '150') return 'contrast(1.5)';
    if (value === '200') return 'contrast(2)';
    return `contrast(${value})`;
  },
  'grayscale': (value: string) => {
    if (value === '0') return 'grayscale(0)';
    if (value === 'grayscale') return 'grayscale(1)'; // Default grayscale value
    if (value === '50') return 'grayscale(0.5)';
    if (value === '100') return 'grayscale(1)';
    return `grayscale(${value})`;
  },
  'hue-rotate': (value: string) => {
    return getSmartHueRotateValue(value);
  },
  'invert': (value: string) => {
    if (value === 'invert') return 'invert(1)'; // Default invert value
    if (value === '0') return 'invert(0)';
    if (value === '50') return 'invert(0.5)';
    if (value === '100') return 'invert(1)';
    return `invert(${value})`;
  },
  'saturate': (value: string) => {
    if (value === '0') return 'saturate(0)';
    if (value === '50') return 'saturate(0.5)';
    if (value === '100') return 'saturate(1)';
    if (value === '150') return 'saturate(1.5)';
    if (value === '200') return 'saturate(2)';
    return `saturate(${value})`;
  },
  'sepia': (value: string) => {
    if (value === 'sepia') return 'sepia(1)'; // Default sepia value
    if (value === '0') return 'sepia(0)';
    if (value === '50') return 'sepia(0.5)';
    if (value === '100') return 'sepia(1)';
    return `sepia(${value})`;
  },
  'drop-shadow': (value: string) => {
    if (value === 'none') return 'drop-shadow(0 0 #0000)';
    if (value === 'sm') return 'drop-shadow(0 1px 1px rgb(0 0 0 / 0.05))';
    if (value === 'md') return 'drop-shadow(0 4px 3px rgb(0 0 0 / 0.07)) drop-shadow(0 2px 2px rgb(0 0 0 / 0.06))';
    if (value === 'lg') return 'drop-shadow(0 10px 8px rgb(0 0 0 / 0.04)) drop-shadow(0 4px 3px rgb(0 0 0 / 0.1))';
    if (value === 'xl') return 'drop-shadow(0 20px 13px rgb(0 0 0 / 0.03)) drop-shadow(0 8px 5px rgb(0 0 0 / 0.08))';
    if (value === '2xl') return 'drop-shadow(0 25px 25px rgb(0 0 0 / 0.15))';
    if (value === 'drop-shadow') return 'drop-shadow(0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px 0 rgb(0 0 0 / 0.06))'; // Default drop-shadow
    return `drop-shadow(${value})`;
  },
  
  // Backdrop filter utilities
  'backdrop-filter': (value: string) => {
    if (value === 'none') return 'none';
    return value; // Allow arbitrary backdrop-filter values
  },
  'backdrop-blur': (value: string) => {
    if (value === 'backdrop-blur') return 'blur(8px)'; // bare `backdrop-blur` utility
    return resolveBlurFilterFunction(value);
  },
  'backdrop-brightness': (value: string) => {
    if (value === '0') return 'brightness(0)';
    if (value === '50') return 'brightness(0.5)';
    if (value === '75') return 'brightness(0.75)';
    if (value === '90') return 'brightness(0.9)';
    if (value === '95') return 'brightness(0.95)';
    if (value === '100') return 'brightness(1)';
    if (value === '105') return 'brightness(1.05)';
    if (value === '110') return 'brightness(1.1)';
    if (value === '125') return 'brightness(1.25)';
    if (value === '150') return 'brightness(1.5)';
    if (value === '200') return 'brightness(2)';
    return `brightness(${value})`;
  },
  'backdrop-contrast': (value: string) => {
    if (value === '0') return 'contrast(0)';
    if (value === '50') return 'contrast(0.5)';
    if (value === '75') return 'contrast(0.75)';
    if (value === '100') return 'contrast(1)';
    if (value === '125') return 'contrast(1.25)';
    if (value === '150') return 'contrast(1.5)';
    if (value === '200') return 'contrast(2)';
    return `contrast(${value})`;
  },
  'backdrop-grayscale': (value: string) => {
    if (value === '0') return 'grayscale(0)';
    if (value === '50') return 'grayscale(0.5)';
    if (value === '100') return 'grayscale(1)';
    return `grayscale(${value})`;
  },
  'backdrop-hue-rotate': (value: string) => {
    return getSmartHueRotateValue(value);
  },
  'backdrop-invert': (value: string) => {
    if (value === 'backdrop-invert') return 'invert(1)'; // Default backdrop invert value
    if (value === '0') return 'invert(0)';
    if (value === '50') return 'invert(0.5)';
    if (value === '100') return 'invert(1)';
    return `invert(${value})`;
  },
  'backdrop-opacity': (value: string) => {
    if (value === '0') return 'opacity(0)';
    if (value === '5') return 'opacity(0.05)';
    if (value === '10') return 'opacity(0.1)';
    if (value === '20') return 'opacity(0.2)';
    if (value === '25') return 'opacity(0.25)';
    if (value === '30') return 'opacity(0.3)';
    if (value === '40') return 'opacity(0.4)';
    if (value === '50') return 'opacity(0.5)';
    if (value === '60') return 'opacity(0.6)';
    if (value === '70') return 'opacity(0.7)';
    if (value === '75') return 'opacity(0.75)';
    if (value === '80') return 'opacity(0.8)';
    if (value === '90') return 'opacity(0.9)';
    if (value === '95') return 'opacity(0.95)';
    if (value === '100') return 'opacity(1)';
    const num = parseFloat(value);
    if (!isNaN(num) && isFinite(num)) {
      if (num >= 0 && num <= 1) return `opacity(${num})`;
      if (num >= 0 && num <= 100) return `opacity(${num / 100})`;
    }
    return `opacity(${value})`;
  },
  'backdrop-saturate': (value: string) => {
    if (value === '0') return 'saturate(0)';
    if (value === '50') return 'saturate(0.5)';
    if (value === '100') return 'saturate(1)';
    if (value === '150') return 'saturate(1.5)';
    if (value === '200') return 'saturate(2)';
    return `saturate(${value})`;
  },
  'backdrop-sepia': (value: string) => {
    if (value === 'backdrop-sepia') return 'sepia(1)'; // Default backdrop sepia value
    if (value === '0') return 'sepia(0)';
    if (value === '50') return 'sepia(0.5)';
    if (value === '100') return 'sepia(1)';
    return `sepia(${value})`;
  },
  
  // Background properties
  'background-attachment': (value: string) => {
    const values: Record<string, string> = {
      'fixed': 'fixed',
      'local': 'local',
      'scroll': 'scroll'
    };
    return values[value] || null;
  },
  'background-clip': (value: string) => {
    const values: Record<string, string> = {
      'border': 'border-box',
      'padding': 'padding-box',
      'content': 'content-box',
      'text': 'text'
    };
    return values[value] || null;
  },
  'background-origin': (value: string) => {
    const values: Record<string, string> = {
      'border': 'border-box',
      'padding': 'padding-box',
      'content': 'content-box'
    };
    return values[value] || null;
  },
  'background-position': (value: string) => {
    const values: Record<string, string> = {
      'bottom': 'bottom',
      'center': 'center',
      'top': 'top',

      // Logical aliases (start/end). CSS background-position doesn't support inline-start,
      // so we map start/end to left/right for behavior parity.
      'start': 'left',
      'end': 'right',
      'start-bottom': 'left bottom',
      'start-top': 'left top',
      'end-bottom': 'right bottom',
      'end-top': 'right top',

      // Two-direction aliases (support both orders)
      'top-start': 'left top',
      'top-end': 'right top',
      'bottom-start': 'left bottom',
      'bottom-end': 'right bottom',
      // Short corner aliases
      ts: 'left top',
      te: 'right top',
      bs: 'left bottom',
      be: 'right bottom',
    };
    return values[value] || value; // Allow arbitrary values
  },
  'background-repeat': (value: string) => {
    const values: Record<string, string> = {
      repeat: 'repeat',
      'no-repeat': 'no-repeat',
      'repeat-x': 'repeat-x',
      'repeat-y': 'repeat-y',
      // Parser passes bg-repeat-round → value "repeat-round" (Tailwind-style class names).
      'repeat-round': 'round',
      'repeat-space': 'space',
      round: 'round',
      space: 'space',
    };
    return values[value] ?? null;
  },
  'background-size': (value: string) => {
    const values: Record<string, string> = {
      'auto': 'auto',
      'cover': 'cover',
      'contain': 'contain'
    };
    return values[value] || value; // Allow arbitrary values
  },
  
  // Scroll properties
  'scroll-behavior': (value: string) => {
    const values: Record<string, string> = {
      'auto': 'auto',
      'smooth': 'smooth'
    };
    return values[value] || null;
  },
  'scroll-snap-type': (value: string) => {
    const values: Record<string, string> = {
      'none': 'none',
      'x': 'x mandatory',
      'y': 'y mandatory',
      'both': 'both mandatory',
      'x-proximity': 'x proximity',
      'y-proximity': 'y proximity',
      'both-proximity': 'both proximity'
    };
    return values[value] || null;
  },
  'scroll-snap-align': (value: string) => {
    const values: Record<string, string> = {
      'start': 'start',
      'end': 'end',
      'center': 'center',
      'align-none': 'none'
    };
    return values[value] || null;
  },
  'scroll-snap-stop': (value: string) => {
    const values: Record<string, string> = {
      'normal': 'normal',
      'always': 'always'
    };
    return values[value] || null;
  },
  'scrollbar-gutter': (value: string) => {
    const values: Record<string, string> = {
      'auto': 'auto',
      'stable': 'stable',
      'both-edges': 'both-edges',
      'stable-both-edges': 'stable both-edges',
      'inherit': 'inherit'
    };
    return values[value] || null;
  },
  'scrollbar-width': (value: string) => {
    const values: Record<string, string> = {
      'auto': 'auto',
      'thin': 'thin',
      'none': 'none'
    };
    return values[value] || null;
  },
  'scrollbar-color': (value: string) => {
    if (value === 'auto') return 'auto';
    if (value === 'transparent') return 'transparent';
    return value; // Allow arbitrary color values
  },
  
  // Scroll spacing utilities
  'scroll-m': (value: string) => {
    return getSmartSpacingValue(value);
  },
  'scroll-mt': (value: string) => {
    return getSmartSpacingValue(value);
  },
  'scroll-me': (value: string) => {
    return getSmartSpacingValue(value);
  },
  'scroll-mb': (value: string) => {
    return getSmartSpacingValue(value);
  },
  'scroll-ms': (value: string) => {
    return getSmartSpacingValue(value);
  },
  'scroll-mx': (value: string) => {
    return getSmartSpacingValue(value);
  },
  'scroll-my': (value: string) => {
    return getSmartSpacingValue(value);
  },
  'scroll-p': (value: string) => {
    return getSmartSpacingValue(value);
  },
  'scroll-pt': (value: string) => {
    return getSmartSpacingValue(value);
  },
  'scroll-pe': (value: string) => {
    return getSmartSpacingValue(value);
  },
  'scroll-pb': (value: string) => {
    return getSmartSpacingValue(value);
  },
  'scroll-ps': (value: string) => {
    return getSmartSpacingValue(value);
  },
  'scroll-px': (value: string) => {
    return getSmartSpacingValue(value);
  },
  'scroll-py': (value: string) => {
    return getSmartSpacingValue(value);
  },
  
  // Ring width/default ring: handled by buildRingUtility() in builder.ts (Tailwind v4 shadow-var pattern).
  // Do not route through CSS_PROPERTY_MAP — assigning one string to --iui-ring-offset-shadow,
  // --iui-ring-shadow, and box-shadow creates self-referential invalid CSS.
  'ring-width': () => null,
  'ring': () => null,
  'ring-offset-width': (value: string) => {
    // Handle negative values (e.g., -2, -4)
    const { isNegative, absoluteValue } = parseNegativeValue(value);
    
    // First try static tokens
    const staticOffsetVal = tokenValues.ringOffsetWidth[absoluteValue as keyof typeof tokenValues.ringOffsetWidth];
    
    // If not found in static tokens, try dynamic calculation
    let offsetVal: string;
    if (staticOffsetVal) {
      offsetVal = staticOffsetVal;
    } else {
      const dynamicVal = getDynamicTokenValue('ring-offset-width', absoluteValue);
      if (dynamicVal) {
        offsetVal = dynamicVal;
      } else {
        return null;
      }
    }
    
    // Apply negative sign if needed
    const finalOffsetVal = isNegative ? `-${offsetVal}` : offsetVal;
    
    // Ring offset creates the offset shadow (Tailwind CSS standard)
    // For negative values, this creates an inset offset
    return `0 0 0 ${finalOffsetVal} var(--iui-ring-offset-color, #fff)`;
  },
  
  // Directional ring utilities
  'ring-t': (value: string) => {
    // Use dynamic token system to support values like ring-t-47, ring-t-23, etc.
    const ringVal = getRingWidthValue(value);
    if (!ringVal) return null;
    
    if (value === '0') {
      return '0 0 transparent';
    }
    
    // Top ring: box-shadow: 0 -{width} 0 0 var(--iui-ring-color, rgb(59 130 246 / 0.5))
    return `0 -${ringVal} 0 0 var(--iui-ring-color, rgb(59 130 246 / 0.5))`;
  },
  'ring-b': (value: string) => {
    // Use dynamic token system to support values like ring-b-47, ring-b-23, etc.
    const ringVal = getRingWidthValue(value);
    if (!ringVal) return null;
    
    if (value === '0') {
      return '0 0 transparent';
    }
    
    // Bottom ring: box-shadow: 0 {width} 0 0 var(--iui-ring-color, rgb(59 130 246 / 0.5))
    return `0 ${ringVal} 0 0 var(--iui-ring-color, rgb(59 130 246 / 0.5))`;
  },
  'ring-s': (value: string) => {
    const ringVal = getRingWidthValue(value);
    if (!ringVal) return null;
    if (value === '0') return '0 0 transparent';
    return `-${ringVal} 0 0 0 var(--iui-ring-color, rgb(59 130 246 / 0.5))`;
  },
  'ring-e': (value: string) => {
    const ringVal = getRingWidthValue(value);
    if (!ringVal) return null;
    if (value === '0') return '0 0 transparent';
    return `${ringVal} 0 0 0 var(--iui-ring-color, rgb(59 130 246 / 0.5))`;
  },
  'ring-x': (value: string) => {
    const ringVal = getRingWidthValue(value);
    if (!ringVal) return null;
    if (value === '0') return '0 0 transparent';
    const c = 'var(--iui-ring-color, rgb(59 130 246 / 0.5))';
    return `-${ringVal} 0 0 0 ${c}, ${ringVal} 0 0 0 ${c}`;
  },
  'ring-y': (value: string) => {
    const ringVal = getRingWidthValue(value);
    if (!ringVal) return null;
    if (value === '0') return '0 0 transparent';
    const c = 'var(--iui-ring-color, rgb(59 130 246 / 0.5))';
    return `0 -${ringVal} 0 0 ${c}, 0 ${ringVal} 0 0 ${c}`;
  },
  'ring-bs': (value: string) => {
    const ringVal = getRingWidthValue(value);
    if (!ringVal) return null;
    if (value === '0') return '0 0 transparent';
    return `0 -${ringVal} 0 0 var(--iui-ring-color, rgb(59 130 246 / 0.5))`;
  },
  'ring-be': (value: string) => {
    const ringVal = getRingWidthValue(value);
    if (!ringVal) return null;
    if (value === '0') return '0 0 transparent';
    return `0 ${ringVal} 0 0 var(--iui-ring-color, rgb(59 130 246 / 0.5))`;
  },
  
  // Divide utilities
  'divide-width': (value: string) => {
    // Bare direction: divide-x, divide-y → 1px (Tailwind default)
    if (value === 'x' || value === 'y') return '1px';
    // Direction with scale: divide-x-4, divide-y-2 — same spacing scale as gap/margin
    const numMatch = value.match(/^[xy]-(.+)$/);
    if (numMatch) {
      const spacingKey = numMatch[1];
      if (spacingKey === '0') return '0px';
      const sp = getSmartSpacingValue(spacingKey);
      return sp || null;
    }
    return null;
  },
  'divide-color': createColorValueGetter() as (
    value: string,
    opacity?: string,
  ) => string | null,
  'divide-style': (value: string) => {
    const styleMap: Record<string, string> = {
      solid: 'solid',
      dashed: 'dashed',
      dotted: 'dotted',
      double: 'double',
      hidden: 'hidden',
      none: 'none',
    };
    return styleMap[value] || null;
  },
  
  // Space utilities
  'space-x-reverse': () => '1',
  'space-y-reverse': () => '1',
  
  // Inset utilities
  'inset-x': (value: string) => {
    const spacingValue = getSmartSpacingValue(value);
    if (!spacingValue) return null;
    return spacingValue;
  },
  'inset-y': (value: string) => {
    const spacingValue = getSmartSpacingValue(value);
    if (!spacingValue) return null;
    return spacingValue;
  },
  
  // Font style utilities
  'font-style': (value: string) => {
    const styleMap: Record<string, string> = {
      'italic': 'italic',
      'not-italic': 'normal'
    };
    return styleMap[value] || null;
  },
  
  // Font variant utilities
  'font-variant-numeric': (value: string) => {
    const variantMap: Record<string, string> = {
      'normal-nums': 'normal',
      'ordinal': 'ordinal',
      'slashed-zero': 'slashed-zero',
      'lining-nums': 'lining-nums',
      'oldstyle-nums': 'oldstyle-nums',
      'proportional-nums': 'proportional-nums',
      'tabular-nums': 'tabular-nums',
      'diagonal-fractions': 'diagonal-fractions',
      'stacked-fractions': 'stacked-fractions'
    };
    return variantMap[value] || null;
  },

  // Writing mode utilities (logical s/e tokens; CSS values stay physical rl/lr)
  'writing-mode': (value: string) => {
    const writingModeMap: Record<string, string> = {
      'horizontal-tb': 'horizontal-tb',
      // Logical tokens: r→e, l→s → rl→es, lr→se
      'vertical-es': 'vertical-rl',
      'vertical-se': 'vertical-lr',
      'sideways-es': 'sideways-rl',
      'sideways-se': 'sideways-lr',
      // Physical aliases (legacy)
      'vertical-rl': 'vertical-rl',
      'vertical-lr': 'vertical-lr',
      'sideways-rl': 'sideways-rl',
      'sideways-lr': 'sideways-lr',
      'initial': 'initial',
      'inherit': 'inherit',
      'unset': 'unset',
    };
    return writingModeMap[value] || null;
  },
  'text-orientation': (value: string) => {
    const orientationMap: Record<string, string> = {
      'mixed': 'mixed',
      'upright': 'upright',
      'sideways': 'sideways',
    };
    return orientationMap[value] || null;
  },
  
  // Overscroll utilities
  'overscroll': (value: string) => {
    const overscrollMap: Record<string, string> = {
      'auto': 'auto',
      'contain': 'contain',
      'none': 'none'
    };
    return overscrollMap[value] || null;
  },
  'overscroll-x': (value: string) => {
    const overscrollMap: Record<string, string> = {
      'auto': 'auto',
      'contain': 'contain',
      'none': 'none'
    };
    return overscrollMap[value] || null;
  },
  'overscroll-y': (value: string) => {
    const overscrollMap: Record<string, string> = {
      'auto': 'auto',
      'contain': 'contain',
      'none': 'none'
    };
    return overscrollMap[value] || null;
  },
  
  // Grid utilities (Tailwind: col-span-2 → span 2 / span 2; col-span-full → 1 / -1)
  'grid-column': (value: string) => {
    if (value === 'auto') return 'auto';
    if (value === 'full') return '1 / -1';
    if (/^\d+$/.test(value)) {
      const n = parseInt(value, 10);
      if (n > 0 && n < 10000) return `span ${n} / span ${n}`;
    }
    return null;
  },
  'grid-row': (value: string) => {
    if (value === 'auto') return 'auto';
    if (value === 'full') return '1 / -1';
    if (/^\d+$/.test(value)) {
      const n = parseInt(value, 10);
      if (n > 0 && n < 10000) return `span ${n} / span ${n}`;
    }
    return null;
  },
  
  // Outline utilities
  'outline-width': (value: string) => {
    const staticValue = tokenValues.outlineWidth[value as keyof typeof tokenValues.outlineWidth];
    if (staticValue) return staticValue;
    // Support dynamic pixel values
    const num = parseFloat(value);
    if (!isNaN(num) && isFinite(num) && num >= 0) {
      return `${num}px`;
    }
    return null;
  },
  'outline-style': (value: string) => tokenValues.outlineStyle[value as keyof typeof tokenValues.outlineStyle] || null,
  'outline-offset': (value: string) => {
    const staticValue = tokenValues.outlineOffset[value as keyof typeof tokenValues.outlineOffset];
    if (staticValue) return staticValue;
    // Support dynamic pixel values (can be negative)
    const { isNegative, absoluteValue } = parseNegativeValue(value);
    const num = parseFloat(absoluteValue);
    if (!isNaN(num) && isFinite(num) && num >= 0) {
      const sign = isNegative ? '-' : '';
      return `${sign}${num}px`;
    }
    return null;
  },
  
  // SVG
  'fill': (value: string) => {
    if (value === 'none') return 'none';
    if (value === 'current') return 'currentColor';
    if (value === 'inherit') return 'inherit';
    if (value === 'transparent') return 'transparent';
    // Use the fill-color VALUE_GETTER for color values
    return `var(--iui-color-${value})`;
  },
  'fill-color': (value: string) => {
    const cssVar = `var(--iui-color-${value})`;
    return cssVar;
  },
  'stroke': (value: string) => {
    if (value === 'none') return 'none';
    if (value === 'current') return 'currentColor';
    if (value === 'inherit') return 'inherit';
    if (value === 'transparent') return 'transparent';
    // Use the stroke-color VALUE_GETTER for color values
    return `var(--iui-color-${value})`;
  },
  'stroke-color': (value: string) => {
    const cssVar = `var(--iui-color-${value})`;
    return cssVar;
  },
  
  // Background and gradient utilities
  'background-image': (value: string) => buildBackgroundGradientImage(value),
  'gradient-from': (value: string, opacity?: string) => {
    const colorGetter = createColorValueGetter();
    const colorValue = value.startsWith('from-') ? value.slice(5) : value;
    if (isGradientStopPosition(colorValue)) return null;
    return colorGetter(colorValue, opacity);
  },
  'gradient-via': (value: string, opacity?: string) => {
    const colorGetter = createColorValueGetter();
    const colorValue = value.startsWith('via-') ? value.slice(4) : value;
    if (isGradientStopPosition(colorValue)) return null;
    return colorGetter(colorValue, opacity);
  },
  'gradient-to': (value: string, opacity?: string) => {
    const colorGetter = createColorValueGetter();
    const colorValue = value.startsWith('to-') ? value.slice(3) : value;
    if (isGradientStopPosition(colorValue)) return null;
    return colorGetter(colorValue, opacity);
  },
  
  // SVG properties
  'stroke-width': (value: string) => {
    if (value === '0') return '0';
    const num = parseFloat(value);
    if (!isNaN(num) && isFinite(num) && num >= 0) return `${num}px`;
    return value;
  },
  'stroke-linecap': (value: string) => {
    const values: Record<string, string> = {
      'butt': 'butt',
      'round': 'round',
      'square': 'square'
    };
    return values[value] || null;
  },
  'stroke-linejoin': (value: string) => {
    const values: Record<string, string> = {
      'miter': 'miter',
      'round': 'round',
      'bevel': 'bevel'
    };
    return values[value] || null;
  },
  'stroke-dasharray': (value: string) => {
    if (value === 'none') return 'none';
    if (value === 'dasharray') return '18 12';
    return value;
  },
  
  // Table properties
  'border-collapse': (value: string) => {
    const values: Record<string, string> = {
      'collapse': 'collapse',
      'separate': 'separate'
    };
    return values[value] || null;
  },
  'border-spacing': (value: string) => {
    if (value === '0') return '0';
    return getSmartSpacingValue(value);
  },
  'border-spacing-x': (value: string) => {
    if (value === '0') return '0';
    return getSmartSpacingValue(value);
  },
  'border-spacing-y': (value: string) => {
    if (value === '0') return '0';
    return getSmartSpacingValue(value);
  },
  'table-layout': (value: string) => {
    const values: Record<string, string> = {
      'auto': 'auto',
      'fixed': 'fixed'
    };
    return values[value] || null;
  },
  'caption-side': (value: string) => (value === 'top' || value === 'bottom') ? value : null,
  
  // List properties — `list-style-type-*` long form; ordered / unordered `list-*` shorthand use split categories.
  ...(() => {
    const ORDERED_LIST_TOKENS = new Set([
      "decimal",
      "decimal-leading-zero",
      "lower-alpha",
      "upper-alpha",
      "lower-roman",
      "upper-roman",
    ]);
    const UNORDERED_LIST_TOKENS = new Set([
      "none",
      "disc",
      "circle",
      "square",
      "disclosure-open",
      "disclosure-closed",
      "star",
      "bullet",
      "plus",
      "minus",
      "dash",
      "check",
      "right-arrow",
      "down-arrow",
    ]);
    const orderedCompoundRe =
      /^(decimal(?:-leading-zero)?|upper-roman|upper-alpha|lower-alpha|lower-roman)-(period|parentheses|double-parentheses)$/;

    const symbolPresets: Record<string, string> = {
      star: "iui-ul-star",
      plus: "iui-ul-plus",
      minus: "iui-ul-minus",
      dash: "iui-ul-dash",
      check: "iui-ul-check",
      /** Heavy check ✔ (distinct from `check` ✓). */
      tick: "iui-ul-tick",
      /** Heavy multiplication cross ✕ (distinct from ballot `x-mark` ✗). */
      cross: "iui-ul-cross",
      "arrow-across": "iui-ul-arrow-across",
      /** Small downward-pointing triangle marker. */
      "down-arrow": "iui-ul-down-arrow",
      /** Filled diamond (◆). */
      diamond: "iui-ul-diamond",
      /** Outline diamond (◇). */
      "diamond-outline": "iui-ul-diamond-outline",
      /** Four-diamond / “cluster” marker (❖). */
      "diamond-cluster": "iui-ul-diamond-cluster",
      /** Hollow square bullet (□). */
      "square-hollow": "iui-ul-square-hollow",
      /** “Double square” / joined-square style (⊞). */
      "square-double": "iui-ul-square-double",
      /** 3D-style arrowhead (➢). */
      arrowhead: "iui-ul-arrowhead",
      /** Legacy duplicate markers (undocumented; same counter-style as canonical). */
      bullet: "iui-ul-disc",
      circle: "iui-ul-disc",
      pointer: "iui-ul-arrowhead",
      "right-arrow": "iui-ul-arrowhead",
      "arrow-right": "iui-ul-arrowhead",
      smiley: "iui-ul-smiley",
      frown: "iui-ul-frown",
      "x-mark": "iui-ul-x-mark",
    };

    // Route base ordered/unordered tokens through custom `iui-*` counter-styles
    // so the marker/content gap is explicit and IDENTICAL across every list
    // utility (ordered & unordered). Without this, base `list-decimal` uses the
    // browser-native `decimal` suffix (implementation-defined) while
    // `list-decimal-period` / `list-star` use our explicit `". "` / `" "` —
    // leading to inconsistent spacing when an <ol> and <ul> sit side by side.
    const baseOrderedMap: Record<string, string> = {
      decimal: "iui-ol-decimal-dot",
      "decimal-leading-zero": "iui-ol-decimal-leading-zero",
      "lower-alpha": "iui-ol-lower-alpha-dot",
      "upper-alpha": "iui-ol-upper-alpha-dot",
      "lower-roman": "iui-ol-lower-roman-dot",
      "upper-roman": "iui-ol-upper-roman-dot",
    };
    const baseUnorderedMap: Record<string, string> = {
      disc: "iui-ul-disc",
      square: "iui-ul-square",
    };

    const resolveListStyleTypeCss = (value: string): string | null => {
      const compound = resolveOrderedCompoundToken(value);
      if (compound) return compound;

      if (baseOrderedMap[value]) return baseOrderedMap[value];
      if (baseUnorderedMap[value]) return baseUnorderedMap[value];
      if (symbolPresets[value]) return symbolPresets[value];

      // `none`, `disclosure-open`, `disclosure-closed` — pass through
      // unchanged (they either hide the marker or are native-only counters
      // where extending them buys nothing visible).
      if (ORDERED_LIST_TOKENS.has(value) || UNORDERED_LIST_TOKENS.has(value)) {
        return value;
      }
      if (/^[a-z][a-z0-9-]{0,48}$/.test(value)) return value;
      return null;
    };

    const isOrderedToken = (value: string) =>
      ORDERED_LIST_TOKENS.has(value) || orderedCompoundRe.test(value);
    const isUnorderedToken = (value: string) =>
      UNORDERED_LIST_TOKENS.has(value) ||
      Object.prototype.hasOwnProperty.call(symbolPresets, value);

    return {
      "list-style-type": resolveListStyleTypeCss,
      "list-style-type-ordered": (value: string) =>
        isOrderedToken(value) ? resolveListStyleTypeCss(value) : null,
      "list-style-type-unordered": (value: string) =>
        isUnorderedToken(value) ? resolveListStyleTypeCss(value) : null,
    };
  })(),
  'list-style-position': (value: string) => {
    const values: Record<string, string> = {
      'list-inside': 'inside',
      'list-outside': 'outside'
    };
    return values[value] || value;
  },
  
  // Sizing & Aspect Ratio
  'container': (value: string) => {
    const values: Record<string, string> = {
      'default': '100%',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px'
    };
    return values[value] || null;
  },
  'object-fit': (value: string) => {
    const values: Record<string, string> = {
      'object-contain': 'contain',
      'object-cover': 'cover',
      'object-fill': 'fill',
      'object-none': 'none',
      'object-scale-down': 'scale-down'
    };
    return values[value] || value;
  },
  'object-position': (value: string) => {
    const values: Record<string, string> = {
      'object-bottom': 'bottom',
      'object-center': 'center',
      // Long-form aliases from parser (`object-position-*` -> `*`)
      center: 'center',
      top: 'center top',
      bottom: 'bottom',
      // NOTE:
      // `object-position` does not consistently accept logical keywords
      // (`inline-start` / `inline-end`) across engines, so DevTools flags
      // them as invalid. Keep the public class API (`object-start*`,
      // `object-end*`) but emit physical keywords via direction-aware vars.
      //
      // Defaults (fallbacks): LTR => start=left, end=right.
      // In RTL we swap these vars in injectGlobalStyles().
      'object-start': 'var(--iui-object-start-x, left) center',
      'object-end': 'var(--iui-object-end-x, right) center',
      'object-start-top': 'var(--iui-object-start-x, left) top',
      'object-start-bottom': 'var(--iui-object-start-x, left) bottom',
      'object-end-top': 'var(--iui-object-end-x, right) top',
      'object-end-bottom': 'var(--iui-object-end-x, right) bottom',
      // Long-form aliases from parser (`object-position-start-top`)
      start: 'var(--iui-object-start-x, left) center',
      end: 'var(--iui-object-end-x, right) center',
      'start-top': 'var(--iui-object-start-x, left) top',
      'start-bottom': 'var(--iui-object-start-x, left) bottom',
      'end-top': 'var(--iui-object-end-x, right) top',
      'end-bottom': 'var(--iui-object-end-x, right) bottom',
      'object-top': 'center top'
    };
    return values[value] ?? null;
  },
  
  // Layout Break
  'break-before': (value: string) => {
    const values: Record<string, string> = {
      'auto': 'auto',
      'avoid': 'avoid',
      'all': 'all',
      'avoid-page': 'avoid-page',
      'avoid-column': 'avoid-column',
      'page': 'page',
      'column': 'column',
      'left': 'left',
      'right': 'right'
    };
    return values[value] || null;
  },
  'break-after': (value: string) => {
    const values: Record<string, string> = {
      'auto': 'auto',
      'avoid': 'avoid',
      'all': 'all',
      'avoid-page': 'avoid-page',
      'avoid-column': 'avoid-column',
      'page': 'page',
      'column': 'column',
      'left': 'left',
      'right': 'right'
    };
    return values[value] || null;
  },
  'break-inside': (value: string) => {
    const values: Record<string, string> = {
      'auto': 'auto',
      'avoid': 'avoid',
      'avoid-page': 'avoid-page',
      'avoid-column': 'avoid-column'
    };
    return values[value] || null;
  },
  
  // Columns
  'columns': (value: string) => {
    if (value === 'auto') return 'auto';
    if (/^\d+$/.test(value)) return value;
    return resolveColumnThemeWidth(value);
  },
  'column-width': (value: string) => {
    if (value === 'auto') return 'auto';
    return resolveColumnThemeWidth(value) ?? getSmartSpacingValue(value);
  },
  'column-fill': (value: string) => {
    const values: Record<string, string> = {
      'auto': 'auto',
      'balance': 'balance',
      'balance-all': 'balance-all'
    };
    return values[value] || null;
  },
  'column-gap': (value: string) => resolveGapSpacingValue(value),
  'column-rule': (value: string) => {
    // Emit column-rule-width: `none` is invalid for width (use 0). Avoid `column-rule` shorthand (resets style/color).
    const values: Record<string, string> = {
      'none': '0',
      'thin': 'thin',
      'medium': 'medium',
      'thick': 'thick'
    };
    return values[value] || null;
  },
  'column-rule-type': (value: string) =>
    tokenValues.borderStyle[value as keyof typeof tokenValues.borderStyle] || null,
  'column-rule-color': createColorValueGetter() as (
    value: string,
    opacity?: string,
  ) => string | null,
  'column-span': (value: string) => {
    const values: Record<string, string> = {
      'none': 'none',
      'all': 'all'
    };
    return values[value] || null;
  },
  
  // Box decoration break
  'box-decoration-break': (value: string) => {
    const values: Record<string, string> = {
      'slice': 'slice',
      'clone': 'clone'
    };
    return values[value] || null;
  },
  
  // Will change
  'will-change': (value: string) => {
    if (value === 'auto') return 'auto';
    if (value === 'scroll') return 'scroll-position';
    if (value === 'contents') return 'contents';
    if (value === 'transform') return 'transform';
    return null; // Reject arbitrary values - handled by hooks
  },
  
  // Forced colors
  'forced-color-adjust': (value: string) => {
    const values: Record<string, string> = {
      'auto': 'auto',
      'none': 'none'
    };
    return values[value] || null;
  },
  
  // Container queries
  'container-type': (value: string) => {
    const values: Record<string, string> = {
      'normal': 'normal',
      'size': 'size',
      'inline-size': 'inline-size'
    };
    return values[value] || null;
  },
  'container-name': (value: string) => {
    if (value === 'none') return 'none';
    return value; // Custom container names (e.g. container-name-sidebar)
  },
};