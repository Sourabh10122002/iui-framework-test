/**
 * IUI Design System - Design Tokens
 * Core design token definitions and semantic mappings
 * Based on comprehensive analysis of classUtils.ts token categories
 */

import * as tokenValues from './values';

// Design token type definitions
export interface DesignToken<T = any> {
  value: T;
  type: string;
  description?: string;
  category?: string;
  $extensions?: Record<string, any>;
}

export interface ColorToken extends DesignToken<string> {
  type: 'color';
}

export interface DimensionToken extends DesignToken<string> {
  type: 'dimension';
}

export interface FontFamilyToken extends DesignToken<string | string[]> {
  type: 'fontFamily';
}

export interface FontWeightToken extends DesignToken<string | number> {
  type: 'fontWeight';
}

export interface FontSizeToken extends DesignToken<string> {
  type: 'fontSize';
}

export interface LineHeightToken extends DesignToken<string | number> {
  type: 'lineHeight';
}

export interface LetterSpacingToken extends DesignToken<string> {
  type: 'letterSpacing';
}

export interface BorderRadiusToken extends DesignToken<string> {
  type: 'borderRadius';
}

export interface BorderWidthToken extends DesignToken<string> {
  type: 'borderWidth';
}

export interface ShadowToken extends DesignToken<string> {
  type: 'shadow';
}

export interface DurationToken extends DesignToken<string> {
  type: 'duration';
}

export interface CubicBezierToken extends DesignToken<string> {
  type: 'cubicBezier';
}

export interface OpacityToken extends DesignToken<string | number> {
  type: 'opacity';
}

// COMPREHENSIVE SEMANTIC TOKENS - Covering ALL categories from classUtils
export const semanticTokens = {
  // COLOR SEMANTIC TOKENS - All color categories from classUtils
  colors: {
    // Text colors
    text: {
      primary: { value: tokenValues.colors['neutral-900'], type: 'color', description: 'Primary text color' },
      secondary: { value: tokenValues.colors['neutral-600'], type: 'color', description: 'Secondary text color' },
      tertiary: { value: tokenValues.colors['neutral-500'], type: 'color', description: 'Tertiary text color' },
      disabled: { value: tokenValues.colors['neutral-400'], type: 'color', description: 'Disabled text color' },
      inverse: { value: tokenValues.colors.white, type: 'color', description: 'Inverse text color' },
      link: { value: tokenValues.colors['brand-600'], type: 'color', description: 'Link text color' },
      linkHover: { value: tokenValues.colors['brand-700'], type: 'color', description: 'Link hover text color' },
      success: { value: tokenValues.colors['success-600'], type: 'color', description: 'Success text color' },
      warning: { value: tokenValues.colors['warning-600'], type: 'color', description: 'Warning text color' },
      danger: { value: tokenValues.colors['danger-600'], type: 'color', description: 'danger text color' },
      info: { value: tokenValues.colors['info-600'], type: 'color', description: 'Info text color' },
    },
    
    // Background colors
    background: {
      primary: { value: tokenValues.colors.white, type: 'color', description: 'Primary background color' },
      secondary: { value: tokenValues.colors['neutral-50'], type: 'color', description: 'Secondary background color' },
      tertiary: { value: tokenValues.colors['neutral-100'], type: 'color', description: 'Tertiary background color' },
      inverse: { value: tokenValues.colors['neutral-900'], type: 'color', description: 'Inverse background color' },
      disabled: { value: tokenValues.colors['neutral-100'], type: 'color', description: 'Disabled background color' },
      success: { value: tokenValues.colors['success-50'], type: 'color', description: 'Success background color' },
      warning: { value: tokenValues.colors['warning-50'], type: 'color', description: 'Warning background color' },
      danger: { value: tokenValues.colors['danger-50'], type: 'color', description: 'danger background color' },
      info: { value: tokenValues.colors['info-50'], type: 'color', description: 'Info background color' },
    },

    // Theme gray backgrounds (neutral palette generator)
    gray: {
      lightest: { value: tokenValues.colors['gray-2'], type: 'color', description: 'Lightest gray background' },
      lighter: { value: tokenValues.colors['gray-10'], type: 'color', description: 'Lighter gray background' },
      light: { value: tokenValues.colors['gray-20'], type: 'color', description: 'Light gray background' },
      medium: { value: tokenValues.colors['gray-50'], type: 'color', description: 'Medium gray background' },
      dark: { value: tokenValues.colors['gray-70'], type: 'color', description: 'Dark gray background' },
      darker: { value: tokenValues.colors['gray-90'], type: 'color', description: 'Darker gray background' },
      darkest: { value: tokenValues.colors['gray-98'], type: 'color', description: 'Darkest gray background' },
    },
    
    // Border colors
    border: {
      primary: { value: tokenValues.colors['neutral-200'], type: 'color', description: 'Primary border color' },
      secondary: { value: tokenValues.colors['neutral-300'], type: 'color', description: 'Secondary border color' },
      focus: { value: tokenValues.colors['brand-500'], type: 'color', description: 'Focus border color' },
      success: { value: tokenValues.colors['success-300'], type: 'color', description: 'Success border color' },
      warning: { value: tokenValues.colors['warning-300'], type: 'color', description: 'Warning border color' },
      danger: { value: tokenValues.colors['danger-300'], type: 'color', description: 'danger border color' },
      info: { value: tokenValues.colors['info-300'], type: 'color', description: 'Info border color' },
    },
    
    // Accent colors
    accent: {
      primary: { value: tokenValues.colors['brand-500'], type: 'color', description: 'Primary accent color' },
      secondary: { value: tokenValues.colors['info-500'], type: 'color', description: 'Secondary accent color' },
    },
    
    // Ring colors
    ring: {
      primary: { value: tokenValues.colors['brand-500'], type: 'color', description: 'Primary ring color' },
      focus: { value: tokenValues.colors['brand-600'], type: 'color', description: 'Focused state color' },
      danger: { value: tokenValues.colors['danger-500'], type: 'color', description: 'danger ring color' },
    },
    
    // Decoration colors
    decoration: {
      primary: { value: tokenValues.colors['brand-500'], type: 'color', description: 'Primary decoration color' },
      secondary: { value: tokenValues.colors['info-500'], type: 'color', description: 'Secondary decoration color' },
    },
    
    // Caret colors
    caret: {
      primary: { value: tokenValues.colors['brand-600'], type: 'color', description: 'Primary caret color' },
    }
  },

  // TYPOGRAPHY SEMANTIC TOKENS - All typography categories from classUtils
  typography: {
    fontFamily: {
      base: {
        value: tokenValues.fontFamily.sans,
        type: 'fontFamily',
        description: 'Base font family for body text'
      },
      heading: {
        value: tokenValues.fontFamily.sans,
        type: 'fontFamily',
        description: 'Font family for headings'
      },
      mono: {
        value: tokenValues.fontFamily.mono,
        type: 'fontFamily',
        description: 'Monospace font family for code'
      },
      serif: {
        value: tokenValues.fontFamily.serif,
        type: 'fontFamily',
        description: 'Serif font family for editorial content'
      }
    },
    
    fontSize: {
      '2xs': { value: tokenValues.fontSize['2xs'][0], type: 'fontSize', description: '2X extra small font size' },
      xs: { value: tokenValues.fontSize.xs[0], type: 'fontSize', description: 'Extra small font size' },
      sm: { value: tokenValues.fontSize.sm[0], type: 'fontSize', description: 'Small font size' },
      base: { value: tokenValues.fontSize.base[0], type: 'fontSize', description: 'Base font size' },
      lg: { value: tokenValues.fontSize.lg[0], type: 'fontSize', description: 'Large font size' },
      xl: { value: tokenValues.fontSize.xl[0], type: 'fontSize', description: 'Extra large font size' },
      '2xl': { value: tokenValues.fontSize['2xl'][0], type: 'fontSize', description: '2X large font size' },
      '3xl': { value: tokenValues.fontSize['3xl'][0], type: 'fontSize', description: '3X large font size' },
      '4xl': { value: tokenValues.fontSize['4xl'][0], type: 'fontSize', description: '4X large font size' },
      '5xl': { value: tokenValues.fontSize['5xl'][0], type: 'fontSize', description: '5X large font size' },
      '6xl': { value: tokenValues.fontSize['6xl'][0], type: 'fontSize', description: '6X large font size' },
      '7xl': { value: tokenValues.fontSize['7xl'][0], type: 'fontSize', description: '7X large font size' },
      '8xl': { value: tokenValues.fontSize['8xl'][0], type: 'fontSize', description: '8X large font size' },
      '9xl': { value: tokenValues.fontSize['9xl'][0], type: 'fontSize', description: '9X large font size' },
    },
    
    fontWeight: {
      thin: { value: tokenValues.fontWeight.thin, type: 'fontWeight', description: 'Thin font weight' },
      extralight: { value: tokenValues.fontWeight.extralight, type: 'fontWeight', description: 'Extra light font weight' },
      light: { value: tokenValues.fontWeight.light, type: 'fontWeight', description: 'Light font weight' },
      regular: { value: tokenValues.fontWeight.regular, type: 'fontWeight', description: 'Regular font weight (400)' },
      medium: { value: tokenValues.fontWeight.medium, type: 'fontWeight', description: 'Medium font weight' },
      semibold: { value: tokenValues.fontWeight.semibold, type: 'fontWeight', description: 'Semi-bold font weight' },
      bold: { value: tokenValues.fontWeight.bold, type: 'fontWeight', description: 'Bold font weight' },
      extrabold: { value: tokenValues.fontWeight.extrabold, type: 'fontWeight', description: 'Extra bold font weight' },
      black: { value: tokenValues.fontWeight.black, type: 'fontWeight', description: 'Black font weight' },
    },
    
    lineHeight: {
      none: { value: tokenValues.lineHeight.none, type: 'lineHeight', description: 'No line height' },
      tight: { value: tokenValues.lineHeight.tight, type: 'lineHeight', description: 'Tight line height' },
      snug: { value: tokenValues.lineHeight.snug, type: 'lineHeight', description: 'Snug line height' },
      normal: { value: tokenValues.lineHeight.normal, type: 'lineHeight', description: 'Normal line height' },
      relaxed: { value: tokenValues.lineHeight.relaxed, type: 'lineHeight', description: 'Relaxed line height' },
      loose: { value: tokenValues.lineHeight.loose, type: 'lineHeight', description: 'Loose line height' },
    },
    
    letterSpacing: {
      tighter: { value: tokenValues.letterSpacing.tighter, type: 'letterSpacing', description: 'Tighter letter spacing' },
      tight: { value: tokenValues.letterSpacing.tight, type: 'letterSpacing', description: 'Tight letter spacing' },
      normal: { value: tokenValues.letterSpacing.normal, type: 'letterSpacing', description: 'Normal letter spacing' },
      wide: { value: tokenValues.letterSpacing.wide, type: 'letterSpacing', description: 'Wide letter spacing' },
      wider: { value: tokenValues.letterSpacing.wider, type: 'letterSpacing', description: 'Wider letter spacing' },
      widest: { value: tokenValues.letterSpacing.widest, type: 'letterSpacing', description: 'Widest letter spacing' },
    }
  },

  // SPACING SEMANTIC TOKENS - All spacing categories from classUtils
  spacing: {
    // Base spacing scale
    xs: { value: tokenValues.spacing['1'], type: 'dimension', description: 'Extra small spacing' },
    sm: { value: tokenValues.spacing['2'], type: 'dimension', description: 'Small spacing' },
    md: { value: tokenValues.spacing['4'], type: 'dimension', description: 'Medium spacing' },
    lg: { value: tokenValues.spacing['6'], type: 'dimension', description: 'Large spacing' },
    xl: { value: tokenValues.spacing['8'], type: 'dimension', description: 'Extra large spacing' },
    '2xl': { value: tokenValues.spacing['12'], type: 'dimension', description: '2X large spacing' },
    '3xl': { value: tokenValues.spacing['16'], type: 'dimension', description: '3X large spacing' },
    '4xl': { value: tokenValues.spacing['20'], type: 'dimension', description: '4X large spacing' },
    '5xl': { value: tokenValues.spacing['24'], type: 'dimension', description: '5X large spacing' },
    
    // Component-specific spacing
    component: {
      compact: { value: tokenValues.spacing['1'], type: 'dimension', description: 'compact component spacing' },
      standard: { value: tokenValues.spacing['2'], type: 'dimension', description: 'standard component spacing' },
      spacious: { value: tokenValues.spacing['4'], type: 'dimension', description: 'spacious component spacing' },
    },
    
    // Layout spacing
    layout: {
      xs: { value: tokenValues.spacing['4'], type: 'dimension', description: 'Extra small layout spacing' },
      sm: { value: tokenValues.spacing['6'], type: 'dimension', description: 'Small layout spacing' },
      md: { value: tokenValues.spacing['8'], type: 'dimension', description: 'Medium layout spacing' },
      lg: { value: tokenValues.spacing['12'], type: 'dimension', description: 'Large layout spacing' },
      xl: { value: tokenValues.spacing['16'], type: 'dimension', description: 'Extra large layout spacing' },
    }
  },

  // BORDER SEMANTIC TOKENS - All border categories from classUtils
  borders: {
    borderRadius: {
      none: { value: tokenValues.borderRadius.none, type: 'borderRadius', description: 'No border radius' },
      xs: { value: tokenValues.borderRadius.xs, type: 'borderRadius', description: 'Extra small border radius' },
      sm: { value: tokenValues.borderRadius.sm, type: 'borderRadius', description: 'Small border radius' },
      base: { value: tokenValues.borderRadius.default, type: 'borderRadius', description: 'Base border radius' },
      md: { value: tokenValues.borderRadius.md, type: 'borderRadius', description: 'Medium border radius' },
      lg: { value: tokenValues.borderRadius.lg, type: 'borderRadius', description: 'Large border radius' },
      xl: { value: tokenValues.borderRadius.xl, type: 'borderRadius', description: 'Extra large border radius' },
      '2xl': { value: tokenValues.borderRadius['2xl'], type: 'borderRadius', description: '2X large border radius' },
      '3xl': { value: tokenValues.borderRadius['3xl'], type: 'borderRadius', description: '3X large border radius' },
      '4xl': { value: tokenValues.borderRadius['4xl'], type: 'borderRadius', description: '4X large border radius' },
      full: { value: tokenValues.borderRadius.full, type: 'borderRadius', description: 'Full border radius' },
    },

    borderWidth: {
      none: { value: tokenValues.borderWidth['0'], type: 'borderWidth', description: 'No border width' },
      thin: { value: tokenValues.borderWidth.default, type: 'borderWidth', description: 'Thin border width' },
      medium: { value: tokenValues.borderWidth['2'], type: 'borderWidth', description: 'Medium border width' },
      thick: { value: tokenValues.borderWidth['4'], type: 'borderWidth', description: 'Thick border width' },
      extraThick: { value: tokenValues.borderWidth['8'], type: 'borderWidth', description: 'Extra thick border width' },
    },

    boxSizing: {
      borderBox: { value: tokenValues.boxSizing.border, type: 'boxSizing', description: 'Box sizing includes padding and border' },
      contentBox: { value: tokenValues.boxSizing.content, type: 'boxSizing', description: 'Box sizing excludes padding and border' },
    }
  },

  // SHADOW SEMANTIC TOKENS - All shadow categories from classUtils
  shadows: {
    none: { value: tokenValues.boxShadow.none, type: 'shadow', description: 'No shadow' },
    xs: { value: tokenValues.boxShadow.xs, type: 'shadow', description: 'Extra small shadow' },
    sm: { value: tokenValues.boxShadow.sm, type: 'shadow', description: 'Small shadow' },
    base: { value: tokenValues.boxShadow.default, type: 'shadow', description: 'Base shadow' },
    md: { value: tokenValues.boxShadow.md, type: 'shadow', description: 'Medium shadow' },
    lg: { value: tokenValues.boxShadow.lg, type: 'shadow', description: 'Large shadow' },
    xl: { value: tokenValues.boxShadow.xl, type: 'shadow', description: 'Extra large shadow' },
    '2xl': { value: tokenValues.boxShadow['2xl'], type: 'shadow', description: '2X large shadow' },
    inner: { value: tokenValues.boxShadow.inner, type: 'shadow', description: 'Inner shadow' },
  },

  // ANIMATION SEMANTIC TOKENS - All animation categories from classUtils
  animation: {
    duration: {
      instant: { value: tokenValues.animationDuration['0'], type: 'duration', description: 'Instant duration' },
      fast: { value: tokenValues.animationDuration.fast, type: 'duration', description: 'Fast duration' },
      normal: { value: tokenValues.animationDuration.normal, type: 'duration', description: 'Normal duration' },
      slow: { value: tokenValues.animationDuration.slow, type: 'duration', description: 'Slow duration' },
    },
    
    easing: {
      linear: { value: tokenValues.animationTimingFunction.linear, type: 'cubicBezier', description: 'Linear easing' },
      easeIn: { value: tokenValues.animationTimingFunction.in, type: 'cubicBezier', description: 'Ease in timing' },
      easeOut: { value: tokenValues.animationTimingFunction.out, type: 'cubicBezier', description: 'Ease out timing' },
      easeInOut: { value: tokenValues.animationTimingFunction['in-out'], type: 'cubicBezier', description: 'Ease in-out timing' },
    }
  },

  // OPACITY SEMANTIC TOKENS - All opacity categories from classUtils
  opacity: {
    transparent: { value: tokenValues.opacity['0'], type: 'opacity', description: 'Fully transparent' },
    subtle: { value: tokenValues.opacity['5'], type: 'opacity', description: 'Subtle opacity' },
    light: { value: tokenValues.opacity['25'], type: 'opacity', description: 'Light opacity' },
    medium: { value: tokenValues.opacity['50'], type: 'opacity', description: 'Medium opacity' },
    heavy: { value: tokenValues.opacity['75'], type: 'opacity', description: 'Heavy opacity' },
    opaque: { value: tokenValues.opacity['100'], type: 'opacity', description: 'Fully opaque' },
    disabled: { value: tokenValues.opacity['40'], type: 'opacity', description: 'Disabled opacity' },
    hover: { value: tokenValues.opacity['80'], type: 'opacity', description: 'Hover opacity' },
    focus: { value: tokenValues.opacity['90'], type: 'opacity', description: 'Focus opacity' },
  },

  // Z-INDEX SEMANTIC TOKENS - All z-index categories from classUtils
  zIndex: {
    base: { value: tokenValues.zIndex['0'], type: 'number', description: 'Base z-index' },
    dropdown: { value: tokenValues.zIndex['10'], type: 'number', description: 'Dropdown z-index' },
    sticky: { value: tokenValues.zIndex['20'], type: 'number', description: 'Sticky z-index' },
    fixed: { value: tokenValues.zIndex['30'], type: 'number', description: 'Fixed z-index' },
    modal: { value: tokenValues.zIndex['40'], type: 'number', description: 'Modal z-index' },
    popover: { value: tokenValues.zIndex['50'], type: 'number', description: 'Popover z-index' },
    tooltip: { value: '60', type: 'number', description: 'Tooltip z-index' },
  },

  // FILTER SEMANTIC TOKENS - All filter categories from classUtils
  filters: {
    blur: {
      none: { value: tokenValues.filters.blur.none, type: 'filter', description: 'No blur' },
      sm: { value: tokenValues.filters.blur.sm, type: 'filter', description: 'Small blur' },
      base: { value: tokenValues.filters.blur.default, type: 'filter', description: 'Base blur' },
      md: { value: tokenValues.filters.blur.md, type: 'filter', description: 'Medium blur' },
      lg: { value: tokenValues.filters.blur.lg, type: 'filter', description: 'Large blur' },
      xl: { value: tokenValues.filters.blur.xl, type: 'filter', description: 'Extra large blur' },
    },
    
    brightness: {
      dim: { value: tokenValues.filters.brightness['75'], type: 'filter', description: 'Dim brightness' },
      normal: { value: tokenValues.filters.brightness['100'], type: 'filter', description: 'Normal brightness' },
      bright: { value: tokenValues.filters.brightness['125'], type: 'filter', description: 'Bright brightness' },
      brighter: { value: tokenValues.filters.brightness['150'], type: 'filter', description: 'Brighter brightness' },
    },
    
    contrast: {
      low: { value: tokenValues.filters.contrast['75'], type: 'filter', description: 'Low contrast' },
      normal: { value: tokenValues.filters.contrast['100'], type: 'filter', description: 'Normal contrast' },
      high: { value: tokenValues.filters.contrast['125'], type: 'filter', description: 'High contrast' },
      higher: { value: tokenValues.filters.contrast['150'], type: 'filter', description: 'Higher contrast' },
    }
  },

  // BREAKPOINT SEMANTIC TOKENS - All responsive categories from classUtils
  breakpoints: {
    sm: { value: tokenValues.screens.sm, type: 'breakpoint', description: 'Small screen breakpoint' },
    md: { value: tokenValues.screens.md, type: 'breakpoint', description: 'Medium screen breakpoint' },
    lg: { value: tokenValues.screens.lg, type: 'breakpoint', description: 'Large screen breakpoint' },
    xl: { value: tokenValues.screens.xl, type: 'breakpoint', description: 'Extra large screen breakpoint' },
    '2xl': { value: tokenValues.screens['2xl'], type: 'breakpoint', description: '2X large screen breakpoint' },
  },

  // PSEUDO-STATE SEMANTIC TOKENS - All pseudo-state categories from classUtils
  pseudoStates: {
    interactive: {
      hover: { value: tokenValues.pseudoStates.hover, type: 'pseudoState', description: 'Hover state' },
      focus: { value: tokenValues.pseudoStates.focus, type: 'pseudoState', description: 'Focus state' },
      active: { value: tokenValues.pseudoStates.active, type: 'pseudoState', description: 'Active state' },
      disabled: { value: tokenValues.pseudoStates.disabled, type: 'pseudoState', description: 'Disabled state' },
      visited: { value: tokenValues.pseudoStates.visited, type: 'pseudoState', description: 'Visited state' },
    },
    
    form: {
      checked: { value: tokenValues.pseudoStates.checked, type: 'pseudoState', description: 'Checked state' },
      required: { value: tokenValues.pseudoStates.required, type: 'pseudoState', description: 'Required state' },
      valid: { value: tokenValues.pseudoStates.valid, type: 'pseudoState', description: 'Valid state' },
      invalid: { value: tokenValues.pseudoStates.invalid, type: 'pseudoState', description: 'Invalid state' },
      placeholder: { value: tokenValues.pseudoStates.placeholder, type: 'pseudoState', description: 'Placeholder state' },
    },
    
    structural: {
      firstChild: { value: tokenValues.pseudoStates['first-child'], type: 'pseudoState', description: 'First child state' },
      lastChild: { value: tokenValues.pseudoStates['last-child'], type: 'pseudoState', description: 'Last child state' },
      onlyChild: { value: tokenValues.pseudoStates['only-child'], type: 'pseudoState', description: 'Only child state' },
      empty: { value: tokenValues.pseudoStates.empty, type: 'pseudoState', description: 'Empty state' },
    },
    
    group: {
      groupHover: { value: tokenValues.pseudoStates['group-hover'], type: 'pseudoState', description: 'Group hover state' },
      groupFocus: { value: tokenValues.pseudoStates['group-focus'], type: 'pseudoState', description: 'Group focus state' },
      peerFocus: { value: tokenValues.pseudoStates['peer-focus'], type: 'pseudoState', description: 'Peer focus state' },
      peerHover: { value: tokenValues.pseudoStates['peer-hover'], type: 'pseudoState', description: 'Peer hover state' },
    },
    
    theme: {
      dark: { value: tokenValues.pseudoStates.dark, type: 'pseudoState', description: 'Dark theme state' },
      light: { value: tokenValues.pseudoStates.light, type: 'pseudoState', description: 'Light theme state' },
      highContrast: { value: tokenValues.pseudoStates['high-contrast'], type: 'pseudoState', description: 'High contrast state' },
      motionSafe: { value: tokenValues.pseudoStates['motion-safe'], type: 'pseudoState', description: 'Motion safe state' },
      motionReduce: { value: tokenValues.pseudoStates['motion-reduce'], type: 'pseudoState', description: 'Motion reduce state' },
    }
  }
} as const;

// Component-specific semantic tokens
export const componentTokens = {
  button: {
    borderRadius: { value: '{borders.borderRadius.base}', type: 'borderRadius' },
    fontSize: { value: '{typography.fontSize.base}', type: 'fontSize' },
    lineHeight: { value: '{typography.lineHeight.normal}', type: 'lineHeight' },
    paddingX: { value: '{spacing.md}', type: 'dimension' },
    paddingY: { value: '{spacing.sm}', type: 'dimension' },
    fontWeight: { value: '{typography.fontWeight.medium}', type: 'fontWeight' },
    transition: { value: '{animation.duration.fast}', type: 'duration' },
  },
  
  input: {
    borderRadius: { value: '{borders.borderRadius.base}', type: 'borderRadius' },
    fontSize: { value: '{typography.fontSize.base}', type: 'fontSize' },
    lineHeight: { value: '{typography.lineHeight.normal}', type: 'lineHeight' },
    paddingX: { value: '{spacing.md}', type: 'dimension' },
    paddingY: { value: '{spacing.sm}', type: 'dimension' },
    borderWidth: { value: '{borders.borderWidth.thin}', type: 'borderWidth' },
  },
  
  card: {
    borderRadius: { value: '{borders.borderRadius.lg}', type: 'borderRadius' },
    shadow: { value: '{shadows.base}', type: 'shadow' },
    padding: { value: '{spacing.lg}', type: 'dimension' },
    borderWidth: { value: '{borders.borderWidth.thin}', type: 'borderWidth' },
  },
  
  modal: {
    borderRadius: { value: '{borders.borderRadius.xl}', type: 'borderRadius' },
    shadow: { value: '{shadows.xl}', type: 'shadow' },
    padding: { value: '{spacing.xl}', type: 'dimension' },
    zIndex: { value: '{zIndex.modal}', type: 'number' },
  },
  
  tooltip: {
    borderRadius: { value: '{borders.borderRadius.md}', type: 'borderRadius' },
    fontSize: { value: '{typography.fontSize.sm}', type: 'fontSize' },
    padding: { value: '{spacing.sm}', type: 'dimension' },
    zIndex: { value: '{zIndex.tooltip}', type: 'number' },
  },
  
  dropdown: {
    borderRadius: { value: '{borders.borderRadius.lg}', type: 'borderRadius' },
    shadow: { value: '{shadows.lg}', type: 'shadow' },
    padding: { value: '{spacing.sm}', type: 'dimension' },
    zIndex: { value: '{zIndex.dropdown}', type: 'number' },
  }
} as const;

// Token reference resolver
export function resolveTokenReference(value: string, tokens: any): string {
  if (typeof value !== 'string' || !value.startsWith('{') || !value.endsWith('}')) {
    return value;
  }

  const tokenPath = value.slice(1, -1);
  const pathParts = tokenPath.split('.');
  
  let current = tokens;
  for (const part of pathParts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return value; // Return original if path doesn't exist
    }
  }

  return current?.value || value;
}

// Token collection for runtime usage
export const designTokens = {
  semantic: semanticTokens,
  component: componentTokens,
  resolve: resolveTokenReference,
  
  // Direct access to token values
  values: tokenValues,
} as const;

export default designTokens;