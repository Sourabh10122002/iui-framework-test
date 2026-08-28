/**
 * IUI Design System - Utility Optimizer
 * CSS optimization and deduplication for utilities
 */

import { CSSUtility, OptimizationStats } from '../types/utility-types';
import { getCSSOptimizationConfig } from '../css/optimization';
import { getImportant } from '../../core/config-loader';
import { logger } from '../../utilities/logger';
import { parseVariants } from '../parsing/variant';
import {
  DIVIDE_BETWEEN_CHILDREN_SUFFIX,
  SPACE_BETWEEN_CHILDREN_SUFFIX,
} from '../utilities/builders';

/**
 * Determine if !important should be used for a utility
 * Follows Tailwind CSS behavior:
 * - Use !important if utility has important flag (from ! prefix)
 * - Use !important if global config has important: true
 * - Never use !important by default
 */
function emitCompanionRule(
  utility: CSSUtility,
  cssRules: string[],
  mediaQueries: Record<string, string[]>,
) {
  if (!utility.companionRule) return;
  const cr = utility.companionRule;
  const useImportant = shouldUseImportant(utility);
  const importantSuffix = useImportant ? " !important" : "";
  const declarations = Object.entries(cr.properties)
    .map(([prop, value]) => `  ${prop}: ${value}${importantSuffix};`)
    .join("\n");
  if (cr.selector.startsWith("@media")) {
    const mediaQuery = cr.selector.split(" { ")[0];
    const selector = cr.selector.split(" { ")[1].replace(" }", "");
    if (!mediaQueries[mediaQuery]) {
      mediaQueries[mediaQuery] = [];
    }
    mediaQueries[mediaQuery].push(`${selector} {\n${declarations}\n}`);
  } else {
    cssRules.push(`${cr.selector} {\n${declarations}\n}`);
  }
}

function shouldUseImportant(utility: CSSUtility): boolean {
  // Check if utility explicitly has important flag (from ! prefix)
  if (utility.important === true) {
    return true;
  }
  
  // Check global config
  const importantConfig = getImportant();
  if (importantConfig === true) {
    return true;
  }
  
  // Default: no !important (Tailwind CSS behavior)
  return false;
}

/**
 * Tailwind cascade: divide-width rules reset --*-divide-*-reverse to 0; divide-*-reverse sets it to 1.
 * Those selectors share the same specificity, so emission order must be width first, reverse last.
 * Color/style divide utilities may appear before width; style composition uses --iui-border-style
 * (Tailwind v4) so width longhands do not overwrite divide-dashed / divide-dotted.
 */
function divideChildCascadeRank(utility: CSSUtility): number | null {
  if (!utility.selector.includes(DIVIDE_BETWEEN_CHILDREN_SUFFIX)) {
    return null;
  }
  const bc = utility.baseClass;
  if (bc === 'divide-x-reverse' || bc === 'divide-y-reverse') {
    return 2;
  }
  if (
    bc === 'divide-x' ||
    bc === 'divide-y' ||
    /^divide-[xy]-/.test(bc)
  ) {
    return 1;
  }
  if (bc.startsWith('divide-')) {
    return 0;
  }
  return null;
}

/**
 * Tailwind cascade for space utilities:
 * - space-x/space-y reset --iui-space-*-reverse to 0
 * - space-*-reverse overrides with 1
 * As with divide children rules, keep declaration order stable and isolated.
 */
function spaceChildCascadeRank(utility: CSSUtility): number | null {
  if (!utility.selector.includes(SPACE_BETWEEN_CHILDREN_SUFFIX)) {
    return null;
  }
  const bc = utility.baseClass;
  if (bc === 'space-x-reverse' || bc === 'space-y-reverse') {
    return 2;
  }
  if (bc.startsWith('space-x-') || bc.startsWith('space-y-')) {
    return 1;
  }
  return null;
}

/** Stable ordering for utilities whose selectors end with the divide-between-children suffix. */
function compareDivideChildUtilitiesForCascade(
  a: CSSUtility,
  b: CSSUtility,
): number {
  const ra = divideChildCascadeRank(a);
  const rb = divideChildCascadeRank(b);
  if (ra === null && rb === null) {
    return 0;
  }
  if (ra === null) {
    return -1;
  }
  if (rb === null) {
    return 1;
  }
  return ra - rb;
}

function compareSpaceChildUtilitiesForCascade(
  a: CSSUtility,
  b: CSSUtility,
): number {
  const ra = spaceChildCascadeRank(a);
  const rb = spaceChildCascadeRank(b);
  if (ra === null && rb === null) {
    return 0;
  }
  if (ra === null) {
    return -1;
  }
  if (rb === null) {
    return 1;
  }
  return ra - rb;
}

/** Keep child combinator utility ordering deterministic across divide + space. */
function compareChildUtilitiesForCascade(a: CSSUtility, b: CSSUtility): number {
  const divideOrder = compareDivideChildUtilitiesForCascade(a, b);
  if (divideOrder !== 0) {
    return divideOrder;
  }
  return compareSpaceChildUtilitiesForCascade(a, b);
}

type ShorthandCascadeSpec = {
  shorthand?: string;
  axis?: string[];
  side: string[];
  /** mx/my-style: both props present → axis rank (between shorthand and single side). */
  pairedAxis?: Array<[string, string]>;
};

function shorthandCascadeRank(
  props: Record<string, string>,
  spec: ShorthandCascadeSpec,
): number | null {
  if (spec.shorthand && spec.shorthand in props) {
    return 0;
  }
  if (spec.pairedAxis?.some(([a, b]) => a in props && b in props)) {
    return 1;
  }
  if (spec.axis?.some((key) => key in props)) {
    return 1;
  }
  if (spec.side.some((key) => key in props)) {
    return 2;
  }
  return null;
}

const SHORTHAND_CASCADE_SPECS: ShorthandCascadeSpec[] = [
  {
    shorthand: "border-color",
    axis: ["border-inline-color", "border-block-color"],
    side: [
      "border-top-color",
      "border-bottom-color",
      "border-inline-start-color",
      "border-inline-end-color",
      "border-block-start-color",
      "border-block-end-color",
    ],
  },
  {
    shorthand: "border-width",
    axis: ["border-inline-width", "border-block-width"],
    side: [
      "border-top-width",
      "border-bottom-width",
      "border-inline-start-width",
      "border-inline-end-width",
      "border-block-start-width",
      "border-block-end-width",
    ],
  },
  {
    shorthand: "border-style",
    axis: ["border-inline-style", "border-block-style"],
    side: [
      "border-top-style",
      "border-bottom-style",
      "border-inline-start-style",
      "border-inline-end-style",
      "border-block-start-style",
      "border-block-end-style",
    ],
  },
  {
    shorthand: "margin",
    pairedAxis: [
      ["margin-inline-start", "margin-inline-end"],
      ["margin-top", "margin-bottom"],
    ],
    side: [
      "margin-top",
      "margin-bottom",
      "margin-inline-start",
      "margin-inline-end",
      "margin-block-start",
      "margin-block-end",
    ],
  },
  {
    shorthand: "padding",
    pairedAxis: [
      ["padding-inline-start", "padding-inline-end"],
      ["padding-top", "padding-bottom"],
    ],
    side: [
      "padding-top",
      "padding-bottom",
      "padding-inline-start",
      "padding-inline-end",
      "padding-block-start",
      "padding-block-end",
    ],
  },
  {
    shorthand: "scroll-margin",
    pairedAxis: [
      ["scroll-margin-inline-start", "scroll-margin-inline-end"],
      ["scroll-margin-top", "scroll-margin-bottom"],
    ],
    side: [
      "scroll-margin-top",
      "scroll-margin-bottom",
      "scroll-margin-inline-start",
      "scroll-margin-inline-end",
    ],
  },
  {
    shorthand: "scroll-padding",
    pairedAxis: [
      ["scroll-padding-inline-start", "scroll-padding-inline-end"],
      ["scroll-padding-top", "scroll-padding-bottom"],
    ],
    side: [
      "scroll-padding-top",
      "scroll-padding-bottom",
      "scroll-padding-inline-start",
      "scroll-padding-inline-end",
    ],
  },
  {
    shorthand: "border-radius",
    pairedAxis: [
      ["border-start-start-radius", "border-start-end-radius"],
      ["border-end-start-radius", "border-end-end-radius"],
      ["border-start-start-radius", "border-end-start-radius"],
      ["border-start-end-radius", "border-end-end-radius"],
    ],
    side: [
      "border-start-start-radius",
      "border-start-end-radius",
      "border-end-start-radius",
      "border-end-end-radius",
    ],
  },
];

function compareShorthandCascadeUtilities(a: CSSUtility, b: CSSUtility): number {
  for (const spec of SHORTHAND_CASCADE_SPECS) {
    const ra = shorthandCascadeRank(a.properties, spec);
    const rb = shorthandCascadeRank(b.properties, spec);
    if (ra === null && rb === null) {
      continue;
    }
    if (ra === null) {
      return -1;
    }
    if (rb === null) {
      return 1;
    }
    if (ra !== rb) {
      return ra - rb;
    }
  }
  return 0;
}

/** Variant stack depth (0 = base utility). Tailwind :where() variants share base specificity — emit fewer variants first so stacked variants win. */
function getVariantDepth(className: string): number {
  return parseVariants(className).variants.length;
}

function compareVariantDepthForCascade(a: CSSUtility, b: CSSUtility): number {
  return getVariantDepth(a.className) - getVariantDepth(b.className);
}

const ANIMATION_MODIFIER_PROPS = new Set([
  "animation-duration",
  "animation-delay",
  "animation-timing-function",
  "animation-iteration-count",
  "animation-direction",
  "animation-fill-mode",
  "animation-play-state",
]);

/**
 * Preset `animate-*` (name / shorthand) first, then duration/ease/delay modifiers.
 * Same specificity — source order is what lets `animate-fade-in animate-ease-linear` compose
 * (tailwindcss-animate). Alphabetical order emits fade-in AFTER ease and the preset wins.
 */
function animationCascadeRank(props: Record<string, string>): number | null {
  if ("animation" in props || "animation-name" in props) {
    return 0;
  }
  for (const key of Object.keys(props)) {
    if (ANIMATION_MODIFIER_PROPS.has(key)) {
      return 1;
    }
  }
  return null;
}

function compareAnimationCascadeUtilities(a: CSSUtility, b: CSSUtility): number {
  const ra = animationCascadeRank(a.properties);
  const rb = animationCascadeRank(b.properties);
  if (ra === null || rb === null) return 0;
  return ra - rb;
}

const TEXT_DECORATION_MODIFIER_PROPS = new Set([
  "text-decoration-style",
  "text-decoration-color",
  "text-decoration-thickness",
]);

function textDecorationCascadeRank(props: Record<string, string>): number | null {
  if ("text-decoration-line" in props || "text-decoration" in props) {
    return 0;
  }
  for (const key of Object.keys(props)) {
    if (TEXT_DECORATION_MODIFIER_PROPS.has(key)) {
      return 1;
    }
  }
  return null;
}

function compareTextDecorationCascadeUtilities(a: CSSUtility, b: CSSUtility): number {
  const ra = textDecorationCascadeRank(a.properties);
  const rb = textDecorationCascadeRank(b.properties);
  if (ra === null || rb === null) return 0;
  return ra - rb;
}

/**
 * `text-*` font-size tokens bundle a default line-height; `leading-*` must sort after
 * so `text-base leading-snug` composes (Tailwind).
 */
function lineHeightCascadeRank(props: Record<string, string>): number | null {
  const hasLineHeight = "line-height" in props;
  if (!hasLineHeight) return null;
  if ("font-size" in props) return 0;
  return 1;
}

function compareLineHeightCascadeUtilities(a: CSSUtility, b: CSSUtility): number {
  const ra = lineHeightCascadeRank(a.properties);
  const rb = lineHeightCascadeRank(b.properties);
  if (ra === null || rb === null) return 0;
  return ra - rb;
}

/** Batch optimizer groups by property signature — re-order keys at emit time (Tailwind cascade). */
function propertyGroupCascadeEmissionRank(groupKey: string): number {
  const { signature } = parsePropertyGroupKey(groupKey);
  const props = Object.fromEntries(JSON.parse(signature) as [string, string][]);

  let rank = 1;

  const lh = lineHeightCascadeRank(props);
  if (lh === 0) rank = 0;
  else if (lh === 1) rank = 2;

  const anim = animationCascadeRank(props);
  if (anim === 0) rank = Math.min(rank, 0);
  else if (anim === 1) rank = Math.max(rank, 2);

  const td = textDecorationCascadeRank(props);
  if (td === 0) rank = Math.min(rank, 0);
  else if (td === 1) rank = Math.max(rank, 2);

  for (const spec of SHORTHAND_CASCADE_SPECS) {
    const sr = shorthandCascadeRank(props, spec);
    if (sr === 0) rank = Math.min(rank, 0);
    else if (sr === 1) rank = Math.max(rank, 1);
    else if (sr === 2) rank = Math.max(rank, 2);
  }

  return rank;
}

function comparePropertyGroupKeysForEmission(aKey: string, bKey: string): number {
  return (
    propertyGroupCascadeEmissionRank(aKey) -
    propertyGroupCascadeEmissionRank(bKey)
  );
}

function sortedPropertyGroupKeys(groups: Map<string, Set<string>>): string[] {
  return [...groups.keys()].sort(comparePropertyGroupKeysForEmission);
}

/** Stable ordering: divide/space child rules, variant depth, then shorthand-before-longhand cascade (Tailwind). */
function compareUtilitiesForCascade(a: CSSUtility, b: CSSUtility): number {
  const childOrder = compareChildUtilitiesForCascade(a, b);
  if (childOrder !== 0) {
    return childOrder;
  }
  const variantOrder = compareVariantDepthForCascade(a, b);
  if (variantOrder !== 0) {
    return variantOrder;
  }
  const animationOrder = compareAnimationCascadeUtilities(a, b);
  if (animationOrder !== 0) {
    return animationOrder;
  }
  const textDecorationOrder = compareTextDecorationCascadeUtilities(a, b);
  if (textDecorationOrder !== 0) {
    return textDecorationOrder;
  }
  const lineHeightOrder = compareLineHeightCascadeUtilities(a, b);
  if (lineHeightOrder !== 0) {
    return lineHeightOrder;
  }
  return compareShorthandCascadeUtilities(a, b);
}

/**
 * Create a property signature for deduplication
 */
export function createPropertySignature(properties: Record<string, string>): string {
  return JSON.stringify(Object.entries(properties).sort());
}

/** Batch-merge key: same declarations + same !important tier + same cascade tier (never merge dark: with base). */
export function propertyGroupKey(
  properties: Record<string, string>,
  utility?: CSSUtility,
): string {
  const important =
    utility && shouldUseImportant(utility) ? "important" : "normal";
  const cascadeTier = utility
    ? utility.selector.includes(":where(.dark")
      ? "dark"
      : utility.selector.includes(":where(.light")
        ? "light"
        : "base"
    : "base";
  return `${important}::${cascadeTier}::${createPropertySignature(properties)}`;
}

export function parsePropertyGroupKey(groupKey: string): {
  important: boolean;
  signature: string;
} {
  const parts = groupKey.split("::");
  if (parts.length < 3) {
    const sep = groupKey.indexOf("::");
    if (sep === -1) return { important: false, signature: groupKey };
    return {
      important: groupKey.slice(0, sep) === "important",
      signature: groupKey.slice(sep + 2),
    };
  }
  return {
    important: parts[0] === "important",
    signature: parts.slice(2).join("::"),
  };
}

/**
 * Optimize utilities by removing duplicates and applying optimizations
 */
export function optimizeUtilities(
  utilities: CSSUtility[],
  stats: OptimizationStats
): CSSUtility[] {
  const config = getCSSOptimizationConfig();
  
  if (!config.enableRuleDeduplication && !config.enableBatchOptimization) {
    return utilities;
  }
  
  stats.totalRules = utilities.length;
  let optimizedUtilities = utilities;
  
  // Rule-level deduplication
  if (config.enableRuleDeduplication) {
    optimizedUtilities = deduplicateRules(optimizedUtilities, stats, createPropertySignature);
  }
  
  // Development mode warnings
  if (config.enableDuplicateWarnings) {
    detectDuplicates(utilities, createPropertySignature);
  }
  
  return optimizedUtilities;
}

/**
 * Remove duplicate CSS rules
 */
function deduplicateRules(
  utilities: CSSUtility[],
  stats: OptimizationStats,
  createSignature: (props: Record<string, string>) => string
): CSSUtility[] {
  const seenRules = new Map<string, CSSUtility>();
  const deduplicatedUtilities: CSSUtility[] = [];
  
  utilities.forEach(utility => {
    const signature = createSignature(utility.properties);
    const ruleKey = `${signature}:${utility.selector}`;
    
    if (!seenRules.has(ruleKey)) {
      seenRules.set(ruleKey, utility);
      deduplicatedUtilities.push(utility);
    } else {
      stats.duplicatesFound++;
    }
  });
  
  stats.rulesOptimized = utilities.length - deduplicatedUtilities.length;
  
  return deduplicatedUtilities;
}

/**
 * Detect redundant rules: same selector + same declarations, different class names.
 * Responsive/pseudo variants (e.g. p-8 vs md:p-8) share property values but not selectors — not duplicates.
 */
function detectDuplicates(
  utilities: CSSUtility[],
  createSignature: (props: Record<string, string>) => string,
): void {
  const config = getCSSOptimizationConfig();
  const ruleGroups = new Map<string, string[]>();

  utilities.forEach((utility) => {
    const signature = createSignature(utility.properties);
    const ruleKey = `${utility.selector}::${signature}`;
    const classes = ruleGroups.get(ruleKey) || [];
    classes.push(utility.className);
    ruleGroups.set(ruleKey, classes);
  });

  ruleGroups.forEach((classes, ruleKey) => {
    if (classes.length > 1) {
      logger.warn(
        `[IUI Design System] Duplicate CSS rule for classes: ${classes.join(", ")}`,
      );
      if (config.enableVerboseLogging) {
        const signature = ruleKey.split("::").slice(1).join("::");
        logger.log("Properties:", JSON.parse(signature));
      }
    }
  });
}

/**
 * Generate optimized CSS with batch optimization
 * Handles transform merging for multiple transform utilities (Tailwind CSS behavior)
 */
export function generateOptimizedCSS(utilities: CSSUtility[]): string {
  const config = getCSSOptimizationConfig();
  
  if (!config.enableBatchOptimization) {
    return generateStandardCSS(utilities);
  }
  
  // Separate transform utilities from regular utilities
  const transformUtilities: CSSUtility[] = [];
  const regularUtilities: CSSUtility[] = [];
  
  utilities.forEach(utility => {
    if (utility.properties.transform && Object.keys(utility.properties).length === 1) {
      transformUtilities.push(utility);
    } else {
      regularUtilities.push(utility);
    }
  });
  
  const propertyGroups = new Map<string, Set<string>>();
  const mediaQueryGroups = new Map<string, Map<string, Set<string>>>();
  
  // Process regular utilities - store utilities with their important flags
  const utilityMap = new Map<string, CSSUtility>();
  
  // Separate bg-gradient and text-gradient utilities for special handling
  const bgGradientUtilities: CSSUtility[] = [];
  const textGradientUtilities: CSSUtility[] = [];
  const otherUtilities: CSSUtility[] = [];
  
  regularUtilities.forEach(utility => {
    utilityMap.set(utility.selector, utility);
    
    // Check if this is a bg-gradient utility (has --iui-bg-gradient and background-image)
    const isBgGradient = utility.properties['--iui-bg-gradient'] && 
                         utility.properties['background-image'] === `var(--iui-bg-gradient)`;
    
    // Check if this is a text-gradient utility (has --iui-text-gradient)
    const isTextGradient = utility.properties['--iui-text-gradient'];
    
    if (isBgGradient) {
      bgGradientUtilities.push(utility);
    } else if (isTextGradient) {
      textGradientUtilities.push(utility);
    } else {
      otherUtilities.push(utility);
    }
  });
  
  // Extract class names from selectors for matching
  const extractClassName = (selector: string): string => {
    const mediaMatch = selector.match(/^@media\s+[^{]+\s*{\s*(.+)\s*}$/);
    const cleanSel = mediaMatch ? mediaMatch[1] : selector;
    const match = cleanSel.match(/^\.([^\s{:,]+)/);
    return match ? match[1] : '';
  };
  
  // Get all text-gradient class names to build proper :not() selector
  // Industry standard: build selector based on actual classes, not hardcoded patterns
  const textGradientClassNames = textGradientUtilities.map(utility => 
    extractClassName(utility.selector)
  ).filter(Boolean);
  
  // Build :not() selector that excludes all text-gradient classes
  // Format: .bg-sunset:not(.text-glass):not(.text-sunset)
  // This ensures bg-gradient background-image only applies when text-gradient is NOT present
  const buildNotTextGradientSelector = (baseSelector: string): string => {
    if (textGradientClassNames.length === 0) {
      return baseSelector;
    }
    // Build :not() for each text-gradient class
    // Result: .bg-sunset:not(.text-glass):not(.text-sunset)
    const notClauses = textGradientClassNames
      .map(className => `:not(.${className})`)
      .join('');
    return `${baseSelector}${notClauses}`;
  };
  
  // For bg-gradient utilities, generate TWO rules for conditional CSS:
  // 1. .bg-sunset:not(.text-glass) - with background-image (when text-gradient is NOT present)
  // 2. .bg-sunset - with ONLY CSS variable (when text-gradient IS present)
  // This ensures bg-gradient works both standalone and combined with text-gradient
  // Industry standard: conditional CSS generation based on utility combinations
  bgGradientUtilities.forEach(bgUtility => {
    // Create two versions of the properties:
    // Version 1: Full properties with background-image (for standalone use)
    const modifiedProperties = { ...bgUtility.properties };
    
    // Version 2: Only CSS variable, NO background-image (for combined use)
    // The text-gradient's background-image already includes the bg-gradient variable
    const propertiesWithoutBgImage = { ...modifiedProperties };
    delete propertiesWithoutBgImage['background-image'];
    delete propertiesWithoutBgImage['background-clip'];
    delete propertiesWithoutBgImage['-webkit-background-clip'];
    
    // Store both versions with different property signatures
    const propSignature = propertyGroupKey(modifiedProperties, bgUtility);
    const propSignatureNoBg = propertyGroupKey(propertiesWithoutBgImage, bgUtility);
    
    const mediaMatch = bgUtility.selector.match(/^@media\s+([^{]+)\s*{\s*(.+)\s*}$/);
    
    if (mediaMatch) {
      const [, mediaQuery, innerSelector] = mediaMatch;
      const mediaGroup = mediaQueryGroups.get(mediaQuery) || new Map();
      
      // Add the full version (with background-image) with :not() to exclude text-gradient classes
      const notTextGradientSelector = buildNotTextGradientSelector(innerSelector);
      const selectors = mediaGroup.get(propSignature) || new Set();
      selectors.add(notTextGradientSelector);
      mediaGroup.set(propSignature, selectors);
      
      // Add the variable-only version (without background-image) for when text-gradient is present
      // This allows bg-gradient variable to be set even when text-gradient is on the same element
      const selectorsNoBg = mediaGroup.get(propSignatureNoBg) || new Set();
      selectorsNoBg.add(innerSelector);
      mediaGroup.set(propSignatureNoBg, selectorsNoBg);
      
      mediaQueryGroups.set(mediaQuery, mediaGroup);
    } else {
      // Add the full version with :not() to exclude text-gradient classes
      const notTextGradientSelector = buildNotTextGradientSelector(bgUtility.selector);
      const selectors = propertyGroups.get(propSignature) || new Set();
      selectors.add(notTextGradientSelector);
      propertyGroups.set(propSignature, selectors);
      
      // Add the variable-only version (applies when text-gradient is present)
      const selectorsNoBg = propertyGroups.get(propSignatureNoBg) || new Set();
      selectorsNoBg.add(bgUtility.selector);
      propertyGroups.set(propSignatureNoBg, selectorsNoBg);
    }
  });
  
  // Process text-gradient utilities normally (they handle background-image correctly)
  textGradientUtilities.forEach(utility => {
    const propSignature = propertyGroupKey(utility.properties, utility);
    
    const mediaMatch = utility.selector.match(/^@media\s+([^{]+)\s*{\s*(.+)\s*}$/);
    
    if (mediaMatch) {
      const [, mediaQuery, innerSelector] = mediaMatch;
      const mediaGroup = mediaQueryGroups.get(mediaQuery) || new Map();
      const selectors = mediaGroup.get(propSignature) || new Set();
      selectors.add(innerSelector);
      mediaGroup.set(propSignature, selectors);
      mediaQueryGroups.set(mediaQuery, mediaGroup);
    } else {
      const selectors = propertyGroups.get(propSignature) || new Set();
      selectors.add(utility.selector);
      propertyGroups.set(propSignature, selectors);
    }
  });
  
  // Child-combinator rules for divide/space must not participate in batch selector merging.
  // Merged comma selectors can pair unrelated parents with identical blobs and break child targeting.
  const divideChildUtilities: CSSUtility[] = [];
  const spaceChildUtilities: CSSUtility[] = [];
  const companionUtilities: CSSUtility[] = [];
  otherUtilities.sort(compareUtilitiesForCascade);
  otherUtilities.forEach(utility => {
    if (utility.companionRule) {
      companionUtilities.push(utility);
      return;
    }
    if (utility.selector.includes(DIVIDE_BETWEEN_CHILDREN_SUFFIX)) {
      divideChildUtilities.push(utility);
      return;
    }
    if (utility.selector.includes(SPACE_BETWEEN_CHILDREN_SUFFIX)) {
      spaceChildUtilities.push(utility);
      return;
    }

    const propSignature = propertyGroupKey(utility.properties, utility);

    const mediaMatch = utility.selector.match(/^@media\s+([^{]+)\s*{\s*(.+)\s*}$/);

    if (mediaMatch) {
      const [, mediaQuery, innerSelector] = mediaMatch;
      const mediaGroup = mediaQueryGroups.get(mediaQuery) || new Map();
      const selectors = mediaGroup.get(propSignature) || new Set();
      selectors.add(innerSelector);
      mediaGroup.set(propSignature, selectors);
      mediaQueryGroups.set(mediaQuery, mediaGroup);
    } else {
      const selectors = propertyGroups.get(propSignature) || new Set();
      selectors.add(utility.selector);
      propertyGroups.set(propSignature, selectors);
    }
  });
  
  // Process transform utilities - group them separately for merging
  const transformGroups = new Map<string, { selectors: string[]; transforms: string[]; utilities: CSSUtility[] }>();
  
  transformUtilities.forEach(utility => {
    const mediaMatch = utility.selector.match(/^(@media\s+[^{]+)\s*/);
    const mediaKey = mediaMatch ? mediaMatch[1] : 'base';
    
    const group = transformGroups.get(mediaKey) || { selectors: [], transforms: [], utilities: [] };
    group.selectors.push(utility.selector);
    group.transforms.push(utility.properties.transform);
    group.utilities.push(utility);
    transformGroups.set(mediaKey, group);
  });
  
  // Process transform utilities into property groups
  transformUtilities.forEach(utility => {
    const propSignature = propertyGroupKey(
      { transform: utility.properties.transform },
      utility,
    );
    const mediaMatch = utility.selector.match(/^@media\s+([^{]+)\s*{\s*(.+)\s*}$/);
    
    if (mediaMatch) {
      const [, mediaQuery, innerSelector] = mediaMatch;
      const mediaGroup = mediaQueryGroups.get(mediaQuery) || new Map();
      const selectors = mediaGroup.get(propSignature) || new Set();
      selectors.add(innerSelector);
      mediaGroup.set(propSignature, selectors);
      mediaQueryGroups.set(mediaQuery, mediaGroup);
    } else {
      const selectors = propertyGroups.get(propSignature) || new Set();
      selectors.add(utility.selector);
      propertyGroups.set(propSignature, selectors);
    }
  });
  
  // Generate combined transform rules for ALL combinations (not just pairs)
  // This ensures that when 3+ transform utilities are used together, they all merge correctly
  // Tailwind CSS standard: generates rules for all combinations
  const combinedTransformRulesByMedia = new Map<string, Array<{ selector: string; transform: string }>>();
  const combinedTransformRulesBase: Array<{ selector: string; transform: string }> = [];
  
  /**
   * Generate ONLY the full combination rule (industry standard approach)
   * Tailwind CSS approach: Generate individual rules + full combination only
   * Example: [a, b, c] → [a.b.c] (not all subsets)
   * This is more efficient and matches production Tailwind CSS behavior
   */
  const generateFullCombination = (
    items: Array<{ className: string; transform: string }>
  ): { selector: string; transform: string } | null => {
    if (items.length < 2) return null;
    
    // Only generate the full combination (all classes together)
    const selector = '.' + items.map(item => item.className).join('.');
    const transform = items.map(item => item.transform).join(' ');
    
    return { selector, transform };
  };
  
  transformGroups.forEach((group, mediaKey) => {
    // Extract class names and transforms
    const extractClassName = (sel: string): string => {
      const mediaMatch = sel.match(/^@media\s+[^{]+\s*{\s*(.+)\s*}$/);
      const cleanSel = mediaMatch ? mediaMatch[1] : sel;
      const match = cleanSel.match(/^\.([^\s{:,]+)/);
      return match ? match[1] : '';
    };
    
    const items: Array<{ className: string; transform: string }> = [];
    for (let i = 0; i < group.selectors.length; i++) {
      const className = extractClassName(group.selectors[i]);
      if (className) {
        items.push({
          className,
          transform: group.transforms[i]
        });
      }
    }
    
    // Only generate combinations if we have 2+ unique classes
    if (items.length >= 2) {
      const uniqueItems = items.filter((item, index, self) =>
        index === self.findIndex(t => t.className === item.className)
      );
      
      if (uniqueItems.length >= 2) {
        const fullCombination = generateFullCombination(uniqueItems);
        if (fullCombination) {
          if (mediaKey !== 'base') {
            const groupForMedia = combinedTransformRulesByMedia.get(mediaKey) || [];
            groupForMedia.push(fullCombination);
            combinedTransformRulesByMedia.set(mediaKey, groupForMedia);
          } else {
            combinedTransformRulesBase.push(fullCombination);
          }
        }
      }
    }
  });
  
  // Generate optimized CSS
  const cssRules: string[] = [];
  
  // Regular rules (includes individual transform rules)
  for (const groupKey of sortedPropertyGroupKeys(propertyGroups)) {
    const selectors = propertyGroups.get(groupKey)!;
    const { important, signature } = parsePropertyGroupKey(groupKey);
    const properties = JSON.parse(signature);
    const useImportant = important;
    const importantSuffix = useImportant ? ' !important' : '';
    
    const declarations = properties
      .map(([prop, value]: [string, string]) => `  ${prop}: ${value}${importantSuffix};`)
      .join('\n');
    
    const combinedSelectors = Array.from(selectors).join(', ');
    cssRules.push(`${combinedSelectors} {\n${declarations}\n}`);
  }
  
  // Add base combined transform rules (only full combinations - no sorting needed)
  combinedTransformRulesBase.forEach(rule => {
    cssRules.push(`${rule.selector} {\n  transform: ${rule.transform} !important;\n}`);
  });
  
  // Media query rules
  mediaQueryGroups.forEach((propertyMap, mediaQuery) => {
    const mediaRules: string[] = [];
    for (const groupKey of sortedPropertyGroupKeys(propertyMap)) {
      const selectors = propertyMap.get(groupKey)!;
      const { important, signature } = parsePropertyGroupKey(groupKey);
      const properties = JSON.parse(signature);
      const useImportant = important;
      const importantSuffix = useImportant ? ' !important' : '';
      
      const declarations = properties
        .map(([prop, value]: [string, string]) => `    ${prop}: ${value}${importantSuffix};`)
        .join('\n');
      
      const combinedSelectors = Array.from(selectors).join(', ');
      mediaRules.push(`  ${combinedSelectors} {\n${declarations}\n  }`);
    }
    
    // Add combined transform rules for this media query (only full combinations)
    const combinedRules = combinedTransformRulesByMedia.get(`@media ${mediaQuery}`);
    if (combinedRules && combinedRules.length > 0) {
      combinedRules.forEach(rule => {
        const utility = utilities.find(u => rule.selector.includes(u.className));
        const useImportant = utility ? shouldUseImportant(utility) : false;
        const importantSuffix = useImportant ? ' !important' : '';
        mediaRules.push(`  ${rule.selector} {\n    transform: ${rule.transform}${importantSuffix};\n  }`);
      });
    }
    
    cssRules.push(`@media ${mediaQuery} {\n${mediaRules.join('\n\n')}\n}`);
  });

  if (divideChildUtilities.length > 0) {
    cssRules.push(generateStandardCSS(divideChildUtilities));
  }
  if (spaceChildUtilities.length > 0) {
    cssRules.push(generateStandardCSS(spaceChildUtilities));
  }
  if (companionUtilities.length > 0) {
    cssRules.push(generateStandardCSS(companionUtilities));
  }

  return cssRules.join('\n\n');
}

/**
 * Generate standard CSS without optimization
 * Handles transform merging for multiple transform utilities (Tailwind CSS behavior)
 */
export function generateStandardCSS(utilities: CSSUtility[]): string {
  // Separate transform utilities from regular utilities
  const transformUtilities: CSSUtility[] = [];
  const regularUtilities: CSSUtility[] = [];
  
  utilities.forEach(utility => {
    if (utility.properties.transform && Object.keys(utility.properties).length === 1) {
      // Pure transform utility (only has transform property)
      transformUtilities.push(utility);
    } else {
      // Regular utility or utility with transform + other properties
      regularUtilities.push(utility);
    }
  });
  
  const cssRules: string[] = [];
  const mediaQueries: Record<string, string[]> = {};
  
  // Process regular utilities with stable child-cascade ordering.
  // - divide: color/style, then width, then reverse
  // - space: width, then reverse
  regularUtilities.sort(compareUtilitiesForCascade);
  regularUtilities.forEach(utility => {
    const useImportant = shouldUseImportant(utility);
    const importantSuffix = useImportant ? ' !important' : '';
    const declarations = Object.entries(utility.properties)
      .map(([prop, value]) => `  ${prop}: ${value}${importantSuffix};`)
      .join('\n');
    
    if (utility.selector.startsWith('@media')) {
      const mediaQuery = utility.selector.split(' { ')[0];
      const selector = utility.selector.split(' { ')[1].replace(' }', '');
      
      if (!mediaQueries[mediaQuery]) {
        mediaQueries[mediaQuery] = [];
      }
      
      mediaQueries[mediaQuery].push(`${selector} {\n${declarations}\n}`);
    } else {
      const rule = `${utility.selector} {\n${declarations}\n}`;
      cssRules.push(rule);
    }
    emitCompanionRule(utility, cssRules, mediaQueries);
  });
  
  // Process transform utilities (individual rules)
  transformUtilities.forEach(utility => {
    const declarations = `  transform: ${utility.properties.transform} !important;`;
    
    if (utility.selector.startsWith('@media')) {
      const mediaQuery = utility.selector.split(' { ')[0];
      const selector = utility.selector.split(' { ')[1].replace(' }', '');
      
      if (!mediaQueries[mediaQuery]) {
        mediaQueries[mediaQuery] = [];
      }
      
      mediaQueries[mediaQuery].push(`${selector} {\n${declarations}\n}`);
    } else {
      const rule = `${utility.selector} {\n${declarations}\n}`;
      cssRules.push(rule);
    }
  });
  
  // Generate combined transform rules for ALL combinations (not just pairs)
  // Industry standard: Tailwind CSS generates rules for all combinations
  // Example: [a, b, c] → [a.b, a.c, b.c, a.b.c]
  const combinedTransformRulesByMedia = new Map<string, Array<{ selector: string; transform: string }>>();
  const combinedTransformRulesBase: Array<{ selector: string; transform: string }> = [];
  
  /**
   * Generate ONLY the full combination rule (industry standard approach)
   * Tailwind CSS approach: Generate individual rules + full combination only
   * This prevents CSS bloat while ensuring all transforms merge correctly
   */
  const generateFullCombination = (
    items: Array<{ className: string; transform: string }>
  ): { selector: string; transform: string } | null => {
    if (items.length < 2) return null;
    
    // Only generate the full combination (all classes together)
    const selector = '.' + items.map(item => item.className).join('.');
    const transform = items.map(item => item.transform).join(' ');
    
    return { selector, transform };
  };
  
  // Group transform utilities by media query context
  const utilitiesByMedia = new Map<string, Array<{ utility: CSSUtility; className: string }>>();
  const baseUtilities: Array<{ utility: CSSUtility; className: string }> = [];
  
  transformUtilities.forEach(utility => {
    const extractBaseClass = (selector: string): string => {
      const mediaMatch = selector.match(/^@media\s+[^{]+\s*{\s*(.+)\s*}$/);
      const cleanSelector = mediaMatch ? mediaMatch[1] : selector;
      const classMatch = cleanSelector.match(/^\.([^\s{:,]+)/);
      return classMatch ? classMatch[1] : '';
    };
    
    const className = extractBaseClass(utility.selector);
    if (!className) return;
    
    const mediaMatch = utility.selector.match(/^(@media\s+[^{]+)\s*/);
    if (mediaMatch) {
      const mediaQuery = mediaMatch[1];
      const group = utilitiesByMedia.get(mediaQuery) || [];
      group.push({ utility, className });
      utilitiesByMedia.set(mediaQuery, group);
    } else {
      baseUtilities.push({ utility, className });
    }
  });
  
  // Generate combinations for base utilities
  if (baseUtilities.length >= 2) {
    const uniqueItems = baseUtilities
      .filter((item, index, self) =>
        index === self.findIndex(t => t.className === item.className)
      )
      .map(item => ({
        className: item.className,
        transform: item.utility.properties.transform
      }));
    
    if (uniqueItems.length >= 2) {
      const fullCombination = generateFullCombination(uniqueItems);
      if (fullCombination) {
        combinedTransformRulesBase.push(fullCombination);
      }
    }
  }
  
  // Generate combinations for media query utilities
  utilitiesByMedia.forEach((utilities, mediaQuery) => {
    if (utilities.length >= 2) {
      const uniqueItems = utilities
        .filter((item, index, self) =>
          index === self.findIndex(t => t.className === item.className)
        )
        .map(item => ({
          className: item.className,
          transform: item.utility.properties.transform
        }));
      
      if (uniqueItems.length >= 2) {
        const fullCombination = generateFullCombination(uniqueItems);
        if (fullCombination) {
          const group = combinedTransformRulesByMedia.get(mediaQuery) || [];
          group.push(fullCombination);
          combinedTransformRulesByMedia.set(mediaQuery, group);
        }
      }
    }
  });
  
  // Add base combined transform rules (only full combinations - no sorting needed)
  combinedTransformRulesBase.forEach(rule => {
    // Find utility for this selector to check important flag
    const utility = utilities.find(u => rule.selector.includes(u.className));
    const useImportant = utility ? shouldUseImportant(utility) : false;
    const importantSuffix = useImportant ? ' !important' : '';
    cssRules.push(`${rule.selector} {\n  transform: ${rule.transform}${importantSuffix};\n}`);
  });
  
  // Add media query rules (including combined transform rules)
  Object.entries(mediaQueries).forEach(([media, rules]) => {
    const allRules = [...rules];
    
    // Add combined transform rules for this media query (only full combinations)
    const combinedRules = combinedTransformRulesByMedia.get(media);
    if (combinedRules && combinedRules.length > 0) {
      combinedRules.forEach(rule => {
        const utility = utilities.find(u => rule.selector.includes(u.className));
        const useImportant = utility ? shouldUseImportant(utility) : false;
        const importantSuffix = useImportant ? ' !important' : '';
        allRules.push(`${rule.selector} {\n    transform: ${rule.transform}${importantSuffix};\n  }`);
      });
    }
    
    const mediaRule = `${media} {\n${allRules.map(rule => `  ${rule.split('\n').join('\n  ')}`).join('\n\n')}\n}`;
    cssRules.push(mediaRule);
  });
  
  return cssRules.join('\n\n');
}


