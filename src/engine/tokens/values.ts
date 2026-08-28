/**
 * IUI Design System - Token Values
 * Complete design token value definitions for runtime CSS generation
 * Based on comprehensive analysis of classUtils.ts patterns
 */

/** Framework semantic defaults (fixed names — user may override hex in iui.config). */
export const THEME_SEMANTIC_DEFAULT_HEX = {
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
} as const;

/** Framework brand default (see theme-options brandColor). */
export const THEME_BRAND_DEFAULT_HEX = '#6366f1';

/** Framework neutral default (see theme-options neutralColor). */
export const THEME_NEUTRAL_DEFAULT_HEX = '#64748b';

export type ThemeSemanticDefaultKey = keyof typeof THEME_SEMANTIC_DEFAULT_HEX;

/** Framework accent contract colors (fixed names — user may override hex in iui.config). */
export const THEME_ACCENT_CONTRACT_DEFAULT_HEX = {
  white: '#ffffff',
  black: '#000000',
} as const;

// Framework contract colors + keywords — chromatic palettes come from iui.config accent
export const colors = {
  // Standard CSS colors
  'white': '#ffffff',
  'black': '#000000',
  'transparent': 'transparent',
  'current': 'currentColor',
  'inherit': 'inherit',

  // Neutral colors (generated from config at build/runtime)
  'neutral-50': 'var(--iui-color-neutral-50)',
  'neutral-100': 'var(--iui-color-neutral-100)',
  'neutral-200': 'var(--iui-color-neutral-200)',
  'neutral-300': 'var(--iui-color-neutral-300)',
  'neutral-400': 'var(--iui-color-neutral-400)',
  'neutral-500': 'var(--iui-color-neutral-500)',
  'neutral-600': 'var(--iui-color-neutral-600)',
  'neutral-700': 'var(--iui-color-neutral-700)',
  'neutral-800': 'var(--iui-color-neutral-800)',
  'neutral-900': 'var(--iui-color-neutral-900)',
  'neutral-950': 'var(--iui-color-neutral-950)',

  // Theme gray scale (neutral generator, steps 2–98 even) → --iui-color-gray-*
  'gray-2': 'var(--iui-color-gray-2)',
  'gray-4': 'var(--iui-color-gray-4)',
  'gray-6': 'var(--iui-color-gray-6)',
  'gray-8': 'var(--iui-color-gray-8)',
  'gray-10': 'var(--iui-color-gray-10)',
  'gray-12': 'var(--iui-color-gray-12)',
  'gray-14': 'var(--iui-color-gray-14)',
  'gray-16': 'var(--iui-color-gray-16)',
  'gray-18': 'var(--iui-color-gray-18)',
  'gray-20': 'var(--iui-color-gray-20)',
  'gray-22': 'var(--iui-color-gray-22)',
  'gray-24': 'var(--iui-color-gray-24)',
  'gray-26': 'var(--iui-color-gray-26)',
  'gray-28': 'var(--iui-color-gray-28)',
  'gray-30': 'var(--iui-color-gray-30)',
  'gray-32': 'var(--iui-color-gray-32)',
  'gray-34': 'var(--iui-color-gray-34)',
  'gray-36': 'var(--iui-color-gray-36)',
  'gray-38': 'var(--iui-color-gray-38)',
  'gray-40': 'var(--iui-color-gray-40)',
  'gray-42': 'var(--iui-color-gray-42)',
  'gray-44': 'var(--iui-color-gray-44)',
  'gray-46': 'var(--iui-color-gray-46)',
  'gray-48': 'var(--iui-color-gray-48)',
  'gray-50': 'var(--iui-color-gray-50)',
  'gray-52': 'var(--iui-color-gray-52)',
  'gray-54': 'var(--iui-color-gray-54)',
  'gray-56': 'var(--iui-color-gray-56)',
  'gray-58': 'var(--iui-color-gray-58)',
  'gray-60': 'var(--iui-color-gray-60)',
  'gray-62': 'var(--iui-color-gray-62)',
  'gray-64': 'var(--iui-color-gray-64)',
  'gray-66': 'var(--iui-color-gray-66)',
  'gray-68': 'var(--iui-color-gray-68)',
  'gray-70': 'var(--iui-color-gray-70)',
  'gray-72': 'var(--iui-color-gray-72)',
  'gray-74': 'var(--iui-color-gray-74)',
  'gray-76': 'var(--iui-color-gray-76)',
  'gray-78': 'var(--iui-color-gray-78)',
  'gray-80': 'var(--iui-color-gray-80)',
  'gray-82': 'var(--iui-color-gray-82)',
  'gray-84': 'var(--iui-color-gray-84)',
  'gray-86': 'var(--iui-color-gray-86)',
  'gray-88': 'var(--iui-color-gray-88)',
  'gray-90': 'var(--iui-color-gray-90)',
  'gray-92': 'var(--iui-color-gray-92)',
  'gray-94': 'var(--iui-color-gray-94)',
  'gray-96': 'var(--iui-color-gray-96)',
  'gray-98': 'var(--iui-color-gray-98)',

  // Stone colors

  // Semantic brand colors
  'brand-50': 'var(--iui-color-brand-50)',
  'brand-100': 'var(--iui-color-brand-100)',
  'brand-200': 'var(--iui-color-brand-200)',
  'brand-300': 'var(--iui-color-brand-300)',
  'brand-400': 'var(--iui-color-brand-400)',
  'brand-500': 'var(--iui-color-brand-500)',
  'brand-600': 'var(--iui-color-brand-600)',
  'brand-700': 'var(--iui-color-brand-700)',
  'brand-800': 'var(--iui-color-brand-800)',
  'brand-900': 'var(--iui-color-brand-900)',
  'brand-950': 'var(--iui-color-brand-950)',












  // Success semantic colors
  'success-50': 'var(--iui-color-success-50)',
  'success-100': 'var(--iui-color-success-100)',
  'success-200': 'var(--iui-color-success-200)',
  'success-300': 'var(--iui-color-success-300)',
  'success-400': 'var(--iui-color-success-400)',
  'success-500': 'var(--iui-color-success-500)',
  'success-600': 'var(--iui-color-success-600)',
  'success-700': 'var(--iui-color-success-700)',
  'success-800': 'var(--iui-color-success-800)',
  'success-900': 'var(--iui-color-success-900)',
  'success-950': 'var(--iui-color-success-950)',

  // danger semantic colors
  'danger-50': 'var(--iui-color-danger-50)',
  'danger-100': 'var(--iui-color-danger-100)',
  'danger-200': 'var(--iui-color-danger-200)',
  'danger-300': 'var(--iui-color-danger-300)',
  'danger-400': 'var(--iui-color-danger-400)',
  'danger-500': 'var(--iui-color-danger-500)',
  'danger-600': 'var(--iui-color-danger-600)',
  'danger-700': 'var(--iui-color-danger-700)',
  'danger-800': 'var(--iui-color-danger-800)',
  'danger-900': 'var(--iui-color-danger-900)',
  'danger-950': 'var(--iui-color-danger-950)',

  // Warning semantic colors
  'warning-50': 'var(--iui-color-warning-50)',
  'warning-100': 'var(--iui-color-warning-100)',
  'warning-200': 'var(--iui-color-warning-200)',
  'warning-300': 'var(--iui-color-warning-300)',
  'warning-400': 'var(--iui-color-warning-400)',
  'warning-500': 'var(--iui-color-warning-500)',
  'warning-600': 'var(--iui-color-warning-600)',
  'warning-700': 'var(--iui-color-warning-700)',
  'warning-800': 'var(--iui-color-warning-800)',
  'warning-900': 'var(--iui-color-warning-900)',
  'warning-950': 'var(--iui-color-warning-950)',

  // Info semantic colors
  'info-50': 'var(--iui-color-info-50)',
  'info-100': 'var(--iui-color-info-100)',
  'info-200': 'var(--iui-color-info-200)',
  'info-300': 'var(--iui-color-info-300)',
  'info-400': 'var(--iui-color-info-400)',
  'info-500': 'var(--iui-color-info-500)',
  'info-600': 'var(--iui-color-info-600)',
  'info-700': 'var(--iui-color-info-700)',
  'info-800': 'var(--iui-color-info-800)',
  'info-900': 'var(--iui-color-info-900)',
  'info-950': 'var(--iui-color-info-950)',

  // Aliases for common usage
  'success': 'var(--iui-color-success-500)',
  'warning': 'var(--iui-color-warning-500)',
  'danger': 'var(--iui-color-danger-500)',
  'info': 'var(--iui-color-info-500)',
  'neutral': 'var(--iui-color-neutral-500)',
  'brand': 'var(--iui-color-brand-500)',
} as const;

// COMPREHENSIVE SPACING SCALE - All spacing values from classUtils
export const spacing = {
  '0': '0',
  'px': '1px',
  '0.5': '0.125rem',
  '1': '0.25rem',
  '1.5': '0.375rem',
  '2': '0.5rem',
  '2.5': '0.625rem',
  '3': '0.75rem',
  '3.5': '0.875rem',
  '4': '1rem',
  '5': '1.25rem',
  '6': '1.5rem',
  '7': '1.75rem',
  '8': '2rem',
  '9': '2.25rem',
  '10': '2.5rem',
  '11': '2.75rem',
  '12': '3rem',
  '14': '3.5rem',
  '16': '4rem',
  '20': '5rem',
  '24': '6rem',
  '28': '7rem',
  '32': '8rem',
  '36': '9rem',
  '40': '10rem',
  '44': '11rem',
  '48': '12rem',
  '52': '13rem',
  '56': '14rem',
  '60': '15rem',
  '64': '16rem',
  '72': '18rem',
  '80': '20rem',
  '96': '24rem',
  /** Named gaps — align with numeric scale `2` / `4` / `6` (used by `gap-*`, `gap-x-*`, `gap-y-*`). */
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  // Special spacing values
  'auto': 'auto',
  'full': '100%',
  'screen': '100vh',
  'min': 'min-content',
  'max': 'max-content',
  'fit': 'fit-content',
  // Fractional values for width/height
  '1/2': '50%',
  '1/3': '33.333333%',
  '2/3': '66.666667%',
  '1/4': '25%',
  '2/4': '50%',
  '3/4': '75%',
  '1/5': '20%',
  '2/5': '40%',
  '3/5': '60%',
  '4/5': '80%',
  '1/6': '16.666667%',
  '2/6': '33.333333%',
  '3/6': '50%',
  '4/6': '66.666667%',
  '5/6': '83.333333%',
  '1/12': '8.333333%',
  '2/12': '16.666667%',
  '3/12': '25%',
  '4/12': '33.333333%',
  '5/12': '41.666667%',
  '6/12': '50%',
  '7/12': '58.333333%',
  '8/12': '66.666667%',
  '9/12': '75%',
  '10/12': '83.333333%',
  '11/12': '91.666667%',
} as const;

// COMPREHENSIVE FONT SIZES - All typography from classUtils
export const fontSize = {
  '2xs': ['0.625rem', { lineHeight: '0.75rem' }],
  'xs': ['0.75rem', { lineHeight: '1rem' }],
  'sm': ['0.875rem', { lineHeight: '1.25rem' }],
  'base': ['1rem', { lineHeight: '1.5rem' }],
  'lg': ['1.125rem', { lineHeight: '1.75rem' }],
  'xl': ['1.25rem', { lineHeight: '1.75rem' }],
  '2xl': ['1.5rem', { lineHeight: '2rem' }],
  '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
  '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
  '5xl': ['3rem', { lineHeight: '1' }],
  '6xl': ['3.75rem', { lineHeight: '1' }],
  '7xl': ['4.5rem', { lineHeight: '1' }],
  '8xl': ['6rem', { lineHeight: '1' }],
  '9xl': ['8rem', { lineHeight: '1' }],
} as const;

// COMPREHENSIVE FONT WEIGHTS
export const fontWeight = {
  'thin': '100',
  'extralight': '200',
  'light': '300',
  /** Tailwind uses `font-normal`; IUI uses `font-regular` for weight 400. */
  'regular': '400',
  'normal': '400',
  'medium': '500',
  'semibold': '600',
  'bold': '700',
  'extrabold': '800',
  'black': '900',
} as const;

/** Tailwind-style numeric font weights: font-100 … font-900 (multiples of 100 only). */
export function isTailwindFontWeightNumeric(value: string): boolean {
  return /^[1-9]00$/.test(value);
}

// COMPREHENSIVE FONT FAMILIES
export const fontFamily = {
  // Primary fonts (user-configurable)
  'inter': ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'],
  'arial': ['Arial', 'Helvetica', 'ui-sans-serif', 'system-ui', 'sans-serif', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'],
  'mono': ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
  
  // Legacy aliases (for backward compatibility)
  // Tailwind-style sans stack: generic UI sans first (distinct from font-inter).
  'sans': ['ui-sans-serif', 'system-ui', 'sans-serif', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'],
  'serif': ['ui-serif', 'Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
  
  // Additional system fonts
  'system': ['system-ui', 'ui-sans-serif', 'sans-serif', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'],
  'ui': ['ui-sans-serif', 'system-ui', 'sans-serif', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'],
  'sans-serif': ['ui-sans-serif', 'system-ui', 'sans-serif', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'],
  'system-ui': ['system-ui', 'ui-sans-serif', 'sans-serif', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'],
  'ui-sans-serif': ['ui-sans-serif', 'system-ui', 'sans-serif', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'],
} as const;

// COMPREHENSIVE LINE HEIGHTS
export const lineHeight = {
  '3': '.75rem',
  '4': '1rem',
  '5': '1.25rem',
  '6': '1.5rem',
  '7': '1.75rem',
  '8': '2rem',
  '9': '2.25rem',
  '10': '2.5rem',
  'none': '1',
  'tight': '1.25',
  'snug': '1.375',
  'normal': '1.5',
  'relaxed': '1.625',
  'loose': '2',
} as const;

// COMPREHENSIVE LETTER SPACING
export const letterSpacing = {
  'tighter': '-0.05em',
  'tight': '-0.025em',
  'normal': '0em',
  'wide': '0.025em',
  'wider': '0.05em',
  'widest': '0.1em',
} as const;

// COMPREHENSIVE BORDER RADIUS
export const borderRadius = {
  'none': '0',
  'xs': '0.125rem',
  'sm': '0.25rem',
  'default': '0.25rem',
  'md': '0.375rem',
  'lg': '0.5rem',
  'xl': '0.75rem',
  '2xl': '1rem',
  '3xl': '1.5rem',
  '4xl': '2rem',
  'full': '9999px',
} as const;

// COMPREHENSIVE BORDER WIDTHS
export const borderWidth = {
  '0': '0px',
  'default': '1px',
  '1': '1px',
  '2': '2px',
  '3': '3px',
  '4': '4px',
  '5': '5px',
  '6': '6px',
  '7': '7px',
  '8': '8px',
} as const;

// BORDER STYLES
export const borderStyle = {
  'solid': 'solid',
  'dashed': 'dashed',
  'dotted': 'dotted',
  'double': 'double',
  'groove': 'groove',
  'ridge': 'ridge',
  'inset': 'inset',
  'outset': 'outset',
  'none': 'none',
  'hidden': 'hidden',
} as const;

// BOX SIZING
export const boxSizing = {
  'border': 'border-box',
  'content': 'content-box',
} as const;

// RING UTILITIES
export const ringWidth = {
  '0': '0px',
  '1': '1px',
  '2': '2px',
  '4': '4px',
  '8': '8px',
  'inset': 'inset',
} as const;

export const ringOffsetWidth = {
  '0': '0px',
  '1': '1px',
  '2': '2px',
  '4': '4px',
  '8': '8px',
} as const;

// OUTLINE UTILITIES
export const outlineWidth = {
  '0': '0px',
  '1': '1px',
  '2': '2px',
  '4': '4px',
  '8': '8px',
} as const;

export const outlineOffset = {
  '0': '0px',
  '1': '1px',
  '2': '2px',
  '4': '4px',
  '8': '8px',
} as const;

export const outlineStyle = {
  'none': 'none',
  'solid': 'solid',
  'dashed': 'dashed',
  'dotted': 'dotted',
  'double': 'double',
} as const;

// COMPREHENSIVE BOX SHADOWS
// Box shadows now support color customization via --iui-shadow-color variable
// Default shadow color is black, but can be overridden with shadow-{color}-{shade} utilities
export const boxShadow = {
  '2xs': '0 1px 2px 0 var(--iui-shadow-color, rgba(0, 0, 0, 0.05))',
  'xs': '0 1px 2px 0 var(--iui-shadow-color, rgba(0, 0, 0, 0.05))',
  'sm': '0 1px 2px 0 var(--iui-shadow-color, rgba(0, 0, 0, 0.05))',
  'default': '0 1px 3px 0 var(--iui-shadow-color, rgba(0, 0, 0, 0.1)), 0 1px 2px -1px var(--iui-shadow-color, rgba(0, 0, 0, 0.1))',
  'md': '0 4px 6px -1px var(--iui-shadow-color, rgba(0, 0, 0, 0.1)), 0 2px 4px -2px var(--iui-shadow-color, rgba(0, 0, 0, 0.1))',
  'lg': '0 10px 15px -3px var(--iui-shadow-color, rgba(0, 0, 0, 0.1)), 0 4px 6px -4px var(--iui-shadow-color, rgba(0, 0, 0, 0.1))',
  'xl': '0 20px 25px -5px var(--iui-shadow-color, rgba(0, 0, 0, 0.1)), 0 8px 10px -6px var(--iui-shadow-color, rgba(0, 0, 0, 0.1))',
  '2xl': '0 25px 50px -12px var(--iui-shadow-color, rgba(0, 0, 0, 0.25))',
  'inner': 'inset 0 2px 4px 0 var(--iui-shadow-color, rgba(0, 0, 0, 0.05))',
  'none': 'none',
  // Inset variations
  'inset-2xs': 'inset 0 1px 2px 0 var(--iui-shadow-color, rgba(0, 0, 0, 0.05))',
  'inset-xs': 'inset 0 1px 2px 0 var(--iui-shadow-color, rgba(0, 0, 0, 0.05))',
  'inset-sm': 'inset 0 1px 2px 0 var(--iui-shadow-color, rgba(0, 0, 0, 0.05))',
  'inset-md': 'inset 0 4px 6px -1px var(--iui-shadow-color, rgba(0, 0, 0, 0.1)), inset 0 2px 4px -2px var(--iui-shadow-color, rgba(0, 0, 0, 0.1))',
  'inset-lg': 'inset 0 10px 15px -3px var(--iui-shadow-color, rgba(0, 0, 0, 0.1)), inset 0 4px 6px -4px var(--iui-shadow-color, rgba(0, 0, 0, 0.1))',
  'inset-xl': 'inset 0 20px 25px -5px var(--iui-shadow-color, rgba(0, 0, 0, 0.1)), inset 0 8px 10px -6px var(--iui-shadow-color, rgba(0, 0, 0, 0.1))',
  'inset-2xl': 'inset 0 25px 50px -12px var(--iui-shadow-color, rgba(0, 0, 0, 0.25))',
} as const;

// COMPREHENSIVE Z-INDEX
export const zIndex = {
  '0': '0',
  '10': '10',
  '20': '20',
  '30': '30',
  '40': '40',
  '50': '50',
  'auto': 'auto',
} as const;

// COMPREHENSIVE OPACITY SCALE
export const opacity = {
  '0': '0',
  '5': '0.05',
  '10': '0.1',
  '20': '0.2',
  '25': '0.25',
  '30': '0.3',
  '40': '0.4',
  '50': '0.5',
  '60': '0.6',
  '70': '0.7',
  '75': '0.75',
  '80': '0.8',
  '90': '0.9',
  '95': '0.95',
  '100': '1',
} as const;

// COMPREHENSIVE FILTER VALUES
export const filters = {
  // Blur values
  blur: {
    'none': '0',
    'sm': '4px',
    'default': '8px',
    'md': '12px',
    'lg': '16px',
    'xl': '24px',
    '2xl': '40px',
    '3xl': '64px',
  },
  // Brightness values
  brightness: {
    '0': '0',
    '50': '.5',
    '75': '.75',
    '90': '.9',
    '95': '.95',
    '100': '1',
    '105': '1.05',
    '110': '1.1',
    '125': '1.25',
    '150': '1.5',
    '200': '2',
  },
  // Contrast values
  contrast: {
    '0': '0',
    '50': '.5',
    '75': '.75',
    '100': '1',
    '125': '1.25',
    '150': '1.5',
    '200': '2',
  },
  // Hue rotate values
  hueRotate: {
    '0': '0deg',
    '15': '15deg',
    '30': '30deg',
    '60': '60deg',
    '90': '90deg',
    '180': '180deg',
  },
  // Saturate values
  saturate: {
    '0': '0',
    '50': '.5',
    '100': '1',
    '150': '1.5',
    '200': '2',
  },
  // Drop shadow values
  dropShadow: {
    'sm': '0 1px 1px rgb(0 0 0 / 0.05)',
    'default': '0 1px 2px rgb(0 0 0 / 0.1), 0 1px 1px rgb(0 0 0 / 0.06)',
    'md': '0 4px 3px rgb(0 0 0 / 0.07), 0 2px 2px rgb(0 0 0 / 0.06)',
    'lg': '0 10px 8px rgb(0 0 0 / 0.04), 0 4px 3px rgb(0 0 0 / 0.1)',
    'xl': '0 20px 13px rgb(0 0 0 / 0.03), 0 8px 5px rgb(0 0 0 / 0.08)',
    '2xl': '0 25px 25px rgb(0 0 0 / 0.15)',
    'none': '0 0 #0000',
  }
} as const;

// TEXT SHADOW (effects) - preset scale + arbitrary via value-getter fallback
export const textShadow = {
  'none': 'none',
  'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  'default': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
} as const;

// PERSPECTIVE (transforms) - numeric scale (px) + named + none
export const perspective = {
  'none': 'none',
  '0': '0px',
  '100': '100px',
  '200': '200px',
  '300': '300px',
  '400': '400px',
  '500': '500px',
  '600': '600px',
  '700': '700px',
  '800': '800px',
  '900': '900px',
  '1000': '1000px',
  '2000': '2000px',
  '3000': '3000px',
  'dramatic': '100px',
  'near': '300px',
  'normal': '500px',
  'midrange': '800px',
  'distant': '1200px',
} as const;

// COMPREHENSIVE ANIMATION DURATIONS
export const animationDuration = {
  '0': '0ms',
  '50': '50ms',
  '75': '75ms',
  '100': '100ms',
  '150': '150ms',
  '200': '200ms',
  '300': '300ms',
  '500': '500ms',
  '700': '700ms',
  '1000': '1000ms',
  '1500': '1500ms',
  '2000': '2000ms',
  '3000': '3000ms',
  // Semantic durations
  'fast': '150ms',
  'normal': '300ms',
  'slow': '500ms',
} as const;

// COMPREHENSIVE ANIMATION TIMING FUNCTIONS
export const animationTimingFunction = {
  'linear': 'linear',
  'in': 'cubic-bezier(0.4, 0, 1, 1)',
  'out': 'cubic-bezier(0, 0, 0.2, 1)',
  'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
  // Additional easing functions
  'ease': 'ease',
  'ease-in': 'ease-in',
  'ease-out': 'ease-out',
  'ease-in-out': 'ease-in-out',
  // Custom cubic-bezier curves
  'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  'elastic': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  'back': 'cubic-bezier(0.68, -0.6, 0.32, 1.6)',
} as const;

// COMPREHENSIVE BREAKPOINTS
export const screens = {
  'sm': '640px',
  'md': '768px',
  'lg': '1024px',
  'xl': '1280px',
  '2xl': '1536px',
} as const;

// COMPREHENSIVE TRANSFORMS
export const transforms = {
  // Scale values
  scale: {
    '0': '0',
    '50': '.5',
    '75': '.75',
    '90': '.9',
    '95': '.95',
    '100': '1',
    '105': '1.05',
    '110': '1.1',
    '125': '1.25',
    '150': '1.5',
  },
  // Rotate values
  rotate: {
    '0': '0deg',
    '1': '1deg',
    '2': '2deg',
    '3': '3deg',
    '6': '6deg',
    '12': '12deg',
    '45': '45deg',
    '90': '90deg',
    '180': '180deg',
  },
  // Skew values
  skew: {
    '0': '0deg',
    '1': '1deg',
    '2': '2deg',
    '3': '3deg',
    '6': '6deg',
    '12': '12deg',
  }
} as const;

// COMPREHENSIVE GRID VALUES
export const grid = {
  // Grid template columns
  templateColumns: {
    'none': 'none',
    'subgrid': 'subgrid',
    '1': 'repeat(1, minmax(0, 1fr))',
    '2': 'repeat(2, minmax(0, 1fr))',
    '3': 'repeat(3, minmax(0, 1fr))',
    '4': 'repeat(4, minmax(0, 1fr))',
    '5': 'repeat(5, minmax(0, 1fr))',
    '6': 'repeat(6, minmax(0, 1fr))',
    '7': 'repeat(7, minmax(0, 1fr))',
    '8': 'repeat(8, minmax(0, 1fr))',
    '9': 'repeat(9, minmax(0, 1fr))',
    '10': 'repeat(10, minmax(0, 1fr))',
    '11': 'repeat(11, minmax(0, 1fr))',
    '12': 'repeat(12, minmax(0, 1fr))',
  },
  // Grid template rows
  templateRows: {
    'none': 'none',
    'subgrid': 'subgrid',
    '1': 'repeat(1, minmax(0, 1fr))',
    '2': 'repeat(2, minmax(0, 1fr))',
    '3': 'repeat(3, minmax(0, 1fr))',
    '4': 'repeat(4, minmax(0, 1fr))',
    '5': 'repeat(5, minmax(0, 1fr))',
    '6': 'repeat(6, minmax(0, 1fr))',
  },
  // Grid auto columns
  autoColumns: {
    'auto': 'auto',
    'min': 'min-content',
    'max': 'max-content',
    'fr': 'minmax(0, 1fr)',
  },
  // Grid auto rows
  autoRows: {
    'auto': 'auto',
    'min': 'min-content',
    'max': 'max-content',
    'fr': 'minmax(0, 1fr)',
  }
} as const;

// COMPREHENSIVE ASPECT RATIOS
export const aspectRatio = {
  'auto': 'auto',
  'square': '1 / 1',
  'video': '16 / 9',
  'landscape': '4 / 3',
  'portrait': '3 / 4',
  'golden': '1.618 / 1',
  'ultrawide': '21 / 9',
} as const;

// COMPREHENSIVE CURSOR VALUES
export const cursor = {
  'auto': 'auto',
  'default': 'default',
  'pointer': 'pointer',
  'wait': 'wait',
  'text': 'text',
  'move': 'move',
  'help': 'help',
  'not-allowed': 'not-allowed',
  'none': 'none',
  'context-menu': 'context-menu',
  'progress': 'progress',
  'cell': 'cell',
  'crosshair': 'crosshair',
  'vertical-text': 'vertical-text',
  'alias': 'alias',
  'copy': 'copy',
  'no-drop': 'no-drop',
  'grab': 'grab',
  'grabbing': 'grabbing',
  'all-scroll': 'all-scroll',
  'col-resize': 'col-resize',
  'row-resize': 'row-resize',
  'n-resize': 'n-resize',
  'e-resize': 'e-resize',
  's-resize': 's-resize',
  'w-resize': 'w-resize',
  'ne-resize': 'ne-resize',
  'nw-resize': 'nw-resize',
  'se-resize': 'se-resize',
  'sw-resize': 'sw-resize',
  'ew-resize': 'ew-resize',
  'ns-resize': 'ns-resize',
  'nesw-resize': 'nesw-resize',
  'nwse-resize': 'nwse-resize',
  'zoom-in': 'zoom-in',
  'zoom-out': 'zoom-out',
} as const;

// COMPREHENSIVE PSEUDO-STATES AND VARIANTS
export const pseudoStates = {
  // Interactive states
  'hover': ':hover',
  'focus': ':focus',
  'focus-visible': ':focus-visible',
  'focus-within': ':focus-within',
  'active': ':active',
  'visited': ':visited',
  'target': ':target',
  
  // Form states
  'checked': ':checked',
  // NOTE: `:disabled` only matches form controls. Include attribute-based disabled for non-form elements.
  'disabled': ':disabled, [disabled], [aria-disabled="true"], [data-disabled="true"]',  'enabled': ':enabled',
  'required': ':required',
  'valid': ':valid',
  'invalid': ':invalid',
  'in-range': ':in-range',
  'out-of-range': ':out-of-range',
  'placeholder-shown': ':placeholder-shown',
  'autofill': ':autofill',
  'default': ':default',
  'indeterminate': ':indeterminate',
  
  // Structural pseudo-classes
  'first-child': ':first-child',
  'last-child': ':last-child',
  'only-child': ':only-child',
  'first-of-type': ':first-of-type',
  'last-of-type': ':last-of-type',
  'only-of-type': ':only-of-type',
  'nth-child-odd': ':nth-child(odd)',
  'nth-child-even': ':nth-child(even)',
  'nth-of-type-odd': ':nth-of-type(odd)',
  'nth-of-type-even': ':nth-of-type(even)',
  'empty': ':empty',
  'root': ':root',
  
  // Pseudo-elements
  'before': '::before',
  'after': '::-after',
  'first-letter': '::first-letter',
  'first-line': '::first-line',
  'selection': '::selection',
  'placeholder': '::placeholder',
  'backdrop': '::backdrop',
  'marker': '::marker',
  
  // Group and peer states
  'group-hover': '.group:hover &',
  'group-focus': '.group:focus &',
  'group-active': '.group:active &',
  'group-visited': '.group:visited &',
  'group-disabled': '.group:disabled &, .group[disabled] &, .group[aria-disabled="true"] &, .group[data-disabled="true"] &',
  'peer-focus': '.peer:focus ~ &',
  'peer-hover': '.peer:hover ~ &',
  'peer-active': '.peer:active ~ &',
  'peer-disabled': '.peer:disabled ~ &, .peer[disabled] ~ &, .peer[aria-disabled="true"] ~ &, .peer[data-disabled="true"] ~ &',
  'peer-checked': '.peer:checked ~ &',
  'peer-invalid': '.peer:invalid ~ &',
  'peer-valid': '.peer:valid ~ &',
  
  // Media query states
  'print': '@media print',
  'screen': '@media screen',
  'motion-safe': '@media (prefers-reduced-motion: no-preference)',
  'motion-reduce': '@media (prefers-reduced-motion: reduce)',
  'contrast-more': '@media (prefers-contrast: more)',
  'contrast-less': '@media (prefers-contrast: less)',
  
  // Theme states
  'dark': '.dark',
  'light': '.light',
  'high-contrast': '@media (prefers-contrast: high)',
  'forced-colors': '@media (forced-colors: active)',
} as const;

// MAX-WIDTH VALUES
export const maxWidth = {
  '0': '0rem',
  'xs': '20rem',
  'sm': '24rem',
  'md': '28rem',
  'lg': '32rem',
  'xl': '36rem',
  '2xl': '42rem',
  '3xl': '48rem',
  '4xl': '56rem',
  '5xl': '64rem',
  '6xl': '72rem',
  '7xl': '80rem',
  'full': '100%',
  'min': 'min-content',
  'max': 'max-content',
  'fit': 'fit-content',
  'prose': '65ch',
  /** Bare max-w-screen — viewport width cap (align with SPECIAL_VALUES.maxWidth) */
  'screen': '100vw',
  'screen-sm': '640px',
  'screen-md': '768px',
  'screen-lg': '1024px',
  'screen-xl': '1280px',
  'screen-2xl': '1536px',
} as const;

// MAX-HEIGHT VALUES
export const maxHeight = {
  '0': '0rem',
  'xs': '20rem',
  'sm': '24rem',
  'md': '28rem',
  'lg': '32rem',
  'xl': '36rem',
  '2xl': '42rem',
  '3xl': '48rem',
  '4xl': '56rem',
  '5xl': '64rem',
  '6xl': '72rem',
  '7xl': '80rem',
  'full': '100%',
  'screen': '100vh',
  'min': 'min-content',
  'max': 'max-content',
  'fit': 'fit-content',
  'none': 'none',
  /** Readable line measure on block axis when used as h-/block- token */
  'prose': '65ch',
} as const;

// Missing layout and flexbox properties
export const display = {
  block: 'block',
  'inline-block': 'inline-block',
  inline: 'inline',
  flex: 'flex',
  'inline-flex': 'inline-flex',
  table: 'table',
  'inline-table': 'inline-table',
  'table-caption': 'table-caption',
  'table-cell': 'table-cell',
  'table-column': 'table-column',
  'table-column-group': 'table-column-group',
  'table-footer-group': 'table-footer-group',
  'table-header-group': 'table-header-group',
  'table-row-group': 'table-row-group',
  'table-row': 'table-row',
  'flow-root': 'flow-root',
  grid: 'grid',
  'inline-grid': 'inline-grid',
  contents: 'contents',
  'list-item': 'list-item',
  hidden: 'none',
} as const;

export const position = {
  static: 'static',
  fixed: 'fixed',
  absolute: 'absolute',
  relative: 'relative',
  sticky: 'sticky',
} as const;

export const overflow = {
  auto: 'auto',
  hidden: 'hidden',
  clip: 'clip',
  visible: 'visible',
  scroll: 'scroll',
} as const;

export const flexDirection = {
  row: 'row',
  'row-reverse': 'row-reverse',
  col: 'column',
  'col-reverse': 'column-reverse',
} as const;

export const flexWrap = {
  wrap: 'wrap',
  'wrap-reverse': 'wrap-reverse',
  nowrap: 'nowrap',
} as const;

export const flex = {
  1: '1 1 0%',
  auto: '1 1 auto',
  initial: '0 1 auto',
  none: 'none',
} as const;

export const flexGrow = {
  0: '0',
  1: '1',
} as const;

export const flexShrink = {
  0: '0',
  1: '1',
} as const;

export const order = {
  1: '1',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
  10: '10',
  11: '11',
  12: '12',
  first: '-9999',
  last: '9999',
  none: '0',
} as const;

export const justifyContent = {
  normal: 'normal',
  start: 'flex-start',
  end: 'flex-end',
  'end-safe': 'safe flex-end',
  center: 'center',
  'center-safe': 'safe center',
  between: 'space-between',
  around: 'space-around',
  evenly: 'space-evenly',
  stretch: 'stretch',
} as const;

export const alignContent = {
  normal: 'normal',
  center: 'center',
  start: 'flex-start',
  end: 'flex-end',
  between: 'space-between',
  around: 'space-around',
  evenly: 'space-evenly',
  baseline: 'baseline',
  stretch: 'stretch',
} as const;

export const placeContent = {
  start: 'start',
  end: 'end',
  'end-safe': 'safe end',
  center: 'center',
  'center-safe': 'safe center',
  between: 'space-between',
  around: 'space-around',
  evenly: 'space-evenly',
  baseline: 'baseline',
  stretch: 'stretch',
} as const;

export const placeItems = {
  normal: 'normal',
  start: 'start',
  end: 'end',
  'end-safe': 'safe end',
  center: 'center',
  'center-safe': 'safe center',
  baseline: 'baseline',
  stretch: 'stretch',
} as const;

export const placeSelf = {
  auto: 'auto',
  normal: 'normal',
  start: 'start',
  end: 'end',
  'end-safe': 'safe end',
  center: 'center',
  'center-safe': 'safe center',
  stretch: 'stretch',
  baseline: 'baseline',
} as const;

export const justifyItems = {
  normal: 'normal',
  start: 'start',
  end: 'end',
  'end-safe': 'safe end',
  center: 'center',
  'center-safe': 'safe center',
  stretch: 'stretch',
} as const;

export const justifySelf = {
  auto: 'auto',
  normal: 'normal',
  start: 'start',
  end: 'end',
  'end-safe': 'safe end',
  center: 'center',
  'center-safe': 'safe center',
  stretch: 'stretch',
} as const;

// TEXT UNDERLINE OFFSET VALUES
export const textUnderlineOffset = {
  '0': '0px',
  '1': '1px',
  '2': '2px',
  '4': '4px',
  '8': '8px',
} as const;

// TEXT DECORATION STYLE VALUES
export const textDecorationStyle = {
  'solid': 'solid',
  'double': 'double',
  'dotted': 'dotted',
  'dashed': 'dashed',
  'wavy': 'wavy',
} as const;

// TEXT DECORATION THICKNESS VALUES (0 + scale; other numerics handled by value getter)
export const textDecorationThickness = {
  '0': '0px',
  '1': '1px',
  '2': '2px',
  '4': '4px',
  '8': '8px',
} as const;

// TEXT INDENT VALUES
export const textIndent = {
  '0': '0px',
  '1': '0.25rem',
  '2': '0.5rem',
  '4': '1rem',
  '8': '2rem',
} as const;

// VERTICAL ALIGN VALUES
export const verticalAlign = {
  'baseline': 'baseline',
  'top': 'top',
  'middle': 'middle',
  'bottom': 'bottom',
  'text-top': 'text-top',
  'text-bottom': 'text-bottom',
  'sub': 'sub',
  'super': 'super',
} as const;

// WHITESPACE VALUES
export const whitespace = {
  'normal': 'normal',
  'nowrap': 'nowrap',
  'pre': 'pre',
  'pre-line': 'pre-line',
  'pre-wrap': 'pre-wrap',
  'break-spaces': 'break-spaces',
} as const;

// HYPHENS VALUES
export const hyphens = {
  'none': 'none',
  'manual': 'manual',
  'auto': 'auto',
} as const;

export const alignItems = {
  start: 'flex-start',
  end: 'flex-end',
  'end-safe': 'safe flex-end',
  center: 'center',
  'center-safe': 'safe center',
  baseline: 'baseline',
  'baseline-last': 'last baseline',
  stretch: 'stretch',
} as const;

export const alignSelf = {
  auto: 'auto',
  start: 'flex-start',
  end: 'flex-end',
  'end-safe': 'safe flex-end',
  center: 'center',
  'center-safe': 'safe center',
  stretch: 'stretch',
  baseline: 'baseline',
  'baseline-last': 'last baseline',
} as const;

export const gap = {
  0: '0px',
  px: '1px',
  0.5: '0.125rem',
  1: '0.25rem',
  1.5: '0.375rem',
  2: '0.5rem',
  2.5: '0.625rem',
  3: '0.75rem',
  3.5: '0.875rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  7: '1.75rem',
  8: '2rem',
  9: '2.25rem',
  10: '2.5rem',
  11: '2.75rem',
  12: '3rem',
  14: '3.5rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  28: '7rem',
  32: '8rem',
  36: '9rem',
  40: '10rem',
  44: '11rem',
  48: '12rem',
  52: '13rem',
  56: '14rem',
  60: '15rem',
  64: '16rem',
  72: '18rem',
  80: '20rem',
  96: '24rem',
} as const;

export const gridTemplateColumns = {
  1: 'repeat(1, minmax(0, 1fr))',
  2: 'repeat(2, minmax(0, 1fr))',
  3: 'repeat(3, minmax(0, 1fr))',
  4: 'repeat(4, minmax(0, 1fr))',
  5: 'repeat(5, minmax(0, 1fr))',
  6: 'repeat(6, minmax(0, 1fr))',
  7: 'repeat(7, minmax(0, 1fr))',
  8: 'repeat(8, minmax(0, 1fr))',
  9: 'repeat(9, minmax(0, 1fr))',
  10: 'repeat(10, minmax(0, 1fr))',
  11: 'repeat(11, minmax(0, 1fr))',
  12: 'repeat(12, minmax(0, 1fr))',
  none: 'none',
  subgrid: 'subgrid',
} as const;

export const gridTemplateRows = {
  1: 'repeat(1, minmax(0, 1fr))',
  2: 'repeat(2, minmax(0, 1fr))',
  3: 'repeat(3, minmax(0, 1fr))',
  4: 'repeat(4, minmax(0, 1fr))',
  5: 'repeat(5, minmax(0, 1fr))',
  6: 'repeat(6, minmax(0, 1fr))',
  7: 'repeat(7, minmax(0, 1fr))',
  8: 'repeat(8, minmax(0, 1fr))',
  9: 'repeat(9, minmax(0, 1fr))',
  10: 'repeat(10, minmax(0, 1fr))',
  11: 'repeat(11, minmax(0, 1fr))',
  12: 'repeat(12, minmax(0, 1fr))',
  none: 'none',
  subgrid: 'subgrid',
} as const;

export const gridColumn = {
  auto: 'auto',
  'span-1': 'span 1 / span 1',
  'span-2': 'span 2 / span 2',
  'span-3': 'span 3 / span 3',
  'span-4': 'span 4 / span 4',
  'span-5': 'span 5 / span 5',
  'span-6': 'span 6 / span 6',
  'span-7': 'span 7 / span 7',
  'span-8': 'span 8 / span 8',
  'span-9': 'span 9 / span 9',
  'span-10': 'span 10 / span 10',
  'span-11': 'span 11 / span 11',
  'span-12': 'span 12 / span 12',
  'span-full': '1 / -1',
} as const;

export const gridRow = {
  auto: 'auto',
  'span-1': 'span 1 / span 1',
  'span-2': 'span 2 / span 2',
  'span-3': 'span 3 / span 3',
  'span-4': 'span 4 / span 4',
  'span-5': 'span 5 / span 5',
  'span-6': 'span 6 / span 6',
  'span-7': 'span 7 / span 7',
  'span-8': 'span 8 / span 8',
  'span-9': 'span 9 / span 9',
  'span-10': 'span 10 / span 10',
  'span-11': 'span 11 / span 11',
  'span-12': 'span 12 / span 12',
  'span-full': '1 / -1',
} as const;

// Grid positioning values
export const gridColumnStart = {
  auto: 'auto',
  '1': '1',
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
  '7': '7',
  '8': '8',
  '9': '9',
  '10': '10',
  '11': '11',
  '12': '12',
  '13': '13',
} as const;

export const gridColumnEnd = {
  auto: 'auto',
  '1': '1',
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
  '7': '7',
  '8': '8',
  '9': '9',
  '10': '10',
  '11': '11',
  '12': '12',
  '13': '13',
} as const;

export const gridRowStart = {
  auto: 'auto',
  '1': '1',
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
  '7': '7',
} as const;

export const gridRowEnd = {
  auto: 'auto',
  '1': '1',
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
  '7': '7',
} as const;

// Transform properties
export const scale = {
  0: '0',
  25: '0.25',
  50: '0.5',
  75: '0.75',
  90: '0.9',
  95: '0.95',
  100: '1',
  105: '1.05',
  110: '1.1',
  125: '1.25',
  150: '1.5',
  175: '1.75',
  200: '2',
  // Semantic scale values
  'xs': '0.75',
  'sm': '0.875',
  'md': '1',
  'lg': '1.125',
  'xl': '1.25',
  '2xl': '1.5',
  '3xl': '1.75',
  '4xl': '2',
} as const;

export const rotate = {
  0: '0deg',
  1: '1deg',
  2: '2deg',
  3: '3deg',
  6: '6deg',
  12: '12deg',
  15: '15deg',
  30: '30deg',
  45: '45deg',
  60: '60deg',
  90: '90deg',
  120: '120deg',
  135: '135deg',
  150: '150deg',
  180: '180deg',
  210: '210deg',
  225: '225deg',
  240: '240deg',
  270: '270deg',
  300: '300deg',
  315: '315deg',
  330: '330deg',
  360: '360deg',
  // Semantic rotate values
  'quarter': '90deg',
  'half': '180deg',
  'three-quarter': '270deg',
  'full': '360deg',
} as const;

export const translate = {
  0: '0px',
  px: '1px',
  0.5: '0.125rem',
  1: '0.25rem',
  1.5: '0.375rem',
  2: '0.5rem',
  2.5: '0.625rem',
  3: '0.75rem',
  3.5: '0.875rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  7: '1.75rem',
  8: '2rem',
  9: '2.25rem',
  10: '2.5rem',
  11: '2.75rem',
  12: '3rem',
  13: '3.25rem',
  14: '3.5rem',
  15: '3.75rem',
  16: '4rem',
  17: '4.25rem',
  18: '4.5rem',
  19: '4.75rem',
  20: '5rem',
  21: '5.25rem',
  22: '5.5rem',
  23: '5.75rem',
  24: '6rem',
  25: '6.25rem',
  26: '6.5rem',
  27: '6.75rem',
  28: '7rem',
  29: '7.25rem',
  30: '7.5rem',
  31: '7.75rem',
  32: '8rem',
  33: '8.25rem',
  34: '8.5rem',
  35: '8.75rem',
  36: '9rem',
  37: '9.25rem',
  38: '9.5rem',
  39: '9.75rem',
  40: '10rem',
  41: '10.25rem',
  42: '10.5rem',
  43: '10.75rem',
  44: '11rem',
  45: '11.25rem',
  46: '11.5rem',
  47: '11.75rem',
  48: '12rem',
  49: '12.25rem',
  50: '12.5rem',
  51: '12.75rem',
  52: '13rem',
  53: '13.25rem',
  54: '13.5rem',
  55: '13.75rem',
  56: '14rem',
  57: '14.25rem',
  58: '14.5rem',
  59: '14.75rem',
  60: '15rem',
  61: '15.25rem',
  62: '15.5rem',
  63: '15.75rem',
  64: '16rem',
  65: '16.25rem',
  66: '16.5rem',
  67: '16.75rem',
  68: '17rem',
  69: '17.25rem',
  70: '17.5rem',
  71: '17.75rem',
  72: '18rem',
  73: '18.25rem',
  74: '18.5rem',
  75: '18.75rem',
  76: '19rem',
  77: '19.25rem',
  78: '19.5rem',
  79: '19.75rem',
  80: '20rem',
  81: '20.25rem',
  82: '20.5rem',
  83: '20.75rem',
  84: '21rem',
  85: '21.25rem',
  86: '21.5rem',
  87: '21.75rem',
  88: '22rem',
  89: '22.25rem',
  90: '22.5rem',
  91: '22.75rem',
  92: '23rem',
  93: '23.25rem',
  94: '23.5rem',
  95: '23.75rem',
  96: '24rem',
  '1/2': '50%',
  '1/3': '33.333333%',
  '2/3': '66.666667%',
  '1/4': '25%',
  '2/4': '50%',
  '3/4': '75%',
  '1/5': '20%',
  '2/5': '40%',
  '3/5': '60%',
  '4/5': '80%',
  '1/6': '16.666667%',
  '2/6': '33.333333%',
  '3/6': '50%',
  '4/6': '66.666667%',
  '5/6': '83.333333%',
  full: '100%',
} as const;

export const skew = {
  0: '0deg',
  1: '1deg',
  2: '2deg',
  3: '3deg',
  6: '6deg',
  12: '12deg',
  15: '15deg',
  30: '30deg',
  45: '45deg',
  60: '60deg',
  90: '90deg',
  120: '120deg',
  135: '135deg',
  150: '150deg',
  180: '180deg',
  // Semantic skew values
  'xs': '1deg',
  'sm': '2deg',
  'md': '3deg',
  'lg': '6deg',
  'xl': '12deg',
  '2xl': '45deg',
} as const;

// Animation and transition properties
export const transitionProperty = {
  none: 'none',
  all: 'all',
  default: 'color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter',
  colors: 'color, background-color, border-color, text-decoration-color, fill, stroke',
  opacity: 'opacity',
  shadow: 'box-shadow',
  transform: 'transform',
} as const;

export const transitionDuration = {
  0: '0s',
  50: '50ms',
  75: '75ms',
  100: '100ms',
  150: '150ms',
  200: '200ms',
  300: '300ms',
  500: '500ms',
  700: '700ms',
  1000: '1000ms',
  1500: '1500ms',
  2000: '2000ms',
  3000: '3000ms',
  // Semantic durations
  'fast': '150ms',
  'normal': '300ms',
  'slow': '500ms',
} as const;

export const transitionTimingFunction = {
  linear: 'linear',
  'in': 'cubic-bezier(0.4, 0, 1, 1)',
  'out': 'cubic-bezier(0, 0, 0.2, 1)',
  'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
  // Additional easing functions
  'ease': 'ease',
  'ease-in': 'ease-in',
  'ease-out': 'ease-out',
  'ease-in-out': 'ease-in-out',
  // Custom cubic-bezier curves
  'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  'elastic': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  'back': 'cubic-bezier(0.68, -0.6, 0.32, 1.6)',
} as const;

export const transitionDelay = {
  0: '0s',
  50: '50ms',
  75: '75ms',
  100: '100ms',
  150: '150ms',
  200: '200ms',
  300: '300ms',
  500: '500ms',
  700: '700ms',
  1000: '1000ms',
  1500: '1500ms',
  2000: '2000ms',
  3000: '3000ms',
  // Semantic delays
  'fast': '150ms',
  'normal': '300ms',
  'slow': '500ms',
} as const;

export const animationDelay = {
  0: '0s',
  50: '50ms',
  75: '75ms',
  100: '100ms',
  150: '150ms',
  200: '200ms',
  300: '300ms',
  500: '500ms',
  700: '700ms',
  1000: '1000ms',
  1500: '1500ms',
  2000: '2000ms',
  3000: '3000ms',
  // Semantic delays
  'fast': '150ms',
  'normal': '300ms',
  'slow': '500ms',
} as const;

export const animation = {
  none: 'none',
  spin: 'spin 1s linear infinite',
  ping: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
  pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  bounce: 'bounce 1s infinite',
  // Fade animations
  'fade-in': 'fadeIn 0.3s ease-in-out',
  'fade-out': 'fadeOut 0.3s ease-in-out',
  'fade-in-up': 'fadeInUp 0.3s ease-out',
  'fade-in-down': 'fadeInDown 0.3s ease-out',
  // Logical aliases (start/end). Mapped to left/right for LTR parity.
  'fade-in-start': 'fadeInLeft 0.3s ease-out',
  'fade-in-end': 'fadeInRight 0.3s ease-out',
  // Slide animations
  'slide-in-up': 'slideInUp 0.3s ease-out',
  'slide-in-down': 'slideInDown 0.3s ease-out',
  // Logical aliases (start/end). Mapped to left/right for LTR parity.
  'slide-in-start': 'slideInLeft 0.3s ease-out',
  'slide-in-end': 'slideInRight 0.3s ease-out',
  // Scale animations
  'scale-in': 'scaleIn 0.2s ease-out',
  'scale-out': 'scaleOut 0.2s ease-in',
  'scale-in-center': 'scaleInCenter 0.3s ease-out',
  // Zoom animations
  'zoom-in': 'zoomIn 0.3s ease-out',
  'zoom-out': 'zoomOut 0.3s ease-in',
  // Rotate animations
  'rotate-in': 'rotateIn 0.3s ease-out',
  'rotate-out': 'rotateOut 0.3s ease-in',
} as const;

// Responsive breakpoints
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Negative spacing for margins
export const negativeSpacing = {
  0: '0px',
  px: '-1px',
  0.5: '-0.125rem',
  1: '-0.25rem',
  1.5: '-0.375rem',
  2: '-0.5rem',
  2.5: '-0.625rem',
  3: '-0.75rem',
  3.5: '-0.875rem',
  4: '-1rem',
  5: '-1.25rem',
  6: '-1.5rem',
  7: '-1.75rem',
  8: '-2rem',
  9: '-2.25rem',
  10: '-2.5rem',
  11: '-2.75rem',
  12: '-3rem',
  14: '-3.5rem',
  16: '-4rem',
  20: '-5rem',
  24: '-6rem',
  28: '-7rem',
  32: '-8rem',
  36: '-9rem',
  40: '-10rem',
  44: '-11rem',
  48: '-12rem',
  52: '-13rem',
  56: '-14rem',
  60: '-15rem',
  64: '-16rem',
  72: '-18rem',
  80: '-20rem',
  96: '-24rem',
  '1/2': '-50%',
  '1/3': '-33.333333%',
  '2/3': '-66.666667%',
  '1/4': '-25%',
  '2/4': '-50%',
  '3/4': '-75%',
  full: '-100%',
} as const;