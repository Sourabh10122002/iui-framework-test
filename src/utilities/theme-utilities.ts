/**
 * IUI Design System - Theme Utilities
 * Enhanced utilities for theme management with runtime token support
 */

// VariableUtils not used in this file

//Map Spacing Classes - Updated to support both old (xs/sm/md/lg) and new (compact/standard/spacious) values
export function mapSpacingClass(spacing: string): string {
  switch (spacing) {
    // New semantic values (compact/standard/spacious)
    case "compact":
      return "gap-1"; // 0.25rem - compact component spacing
    case "standard":
      return "gap-2"; // 0.5rem - standard component spacing
    case "spacious":
      return "gap-4"; // 1rem - spacious component spacing
    default:
      return "gap-2"; // fallback to standard/md
  }
}

// Map Global Spacing to Button Padding Classes - Updated to support both old and new values
export function mapSpacingToPadding(spacing: string): string {
  switch (spacing) {
    // New semantic values (compact/standard/spacious)
    case "compact":
      return "px-2"; // 0.5rem - compact padding
    case "standard":
      return "px-4"; // 1rem - standard padding
    case "spacious":
      return "px-6"; // 1.5rem - spacious padding
    default:
      return "px-4"; // fallback to standard/md
  }
}

export function mapRadius(radius: string): string {
  switch (radius) {
    case "none":
      return "rounded-none";
    case "sm":
      return "rounded-sm";
    case "md":
      return "rounded-lg";
    case "lg":
      return "rounded-2xl";
    case "full":
      return "rounded-full";
    default:
      return "rounded-md";
  }
}

export function getResponsiveRadius(radiusType: string, size: string): number {
  const sizeHeights: Record<string, number> = {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 48,
  };
  const height = sizeHeights[size] || 40;
  // Use a different ratio for each radius type
  let ratio = 0.0;
  if (radiusType === "sm") ratio = 0.15;
  if (radiusType === "md") ratio = 0.25;
  if (radiusType === "lg") ratio = 0.4;
  // stone stays 0, full is handled in button.tsx
  return Math.floor(height * ratio);
}
export const fontMap: Record<string, string> = {
  inter: "font-inter",
  arial: "font-arial",
  mono: "font-mono",
};
export function mapFont(fontKey: string = "inter"): string {
  return fontMap[fontKey] || fontMap.inter;
}

// Convert hex to HSL
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  // hex = hex.replace("#", "");
  let r = 0,
    g = 0,
    b = 0;
  if (hex.length === 4) {
    // Shorthand #RGB
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    // Full #RRGGBB
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  } else {
    throw new Error("Invalid Hex Color Format. Use #RGB or #RRGGBB.");
  }

  // Normalize RGB values to the range [0, 1]
  r /= 255;
  g /= 255;
  b /= 255;

  // Find max, min, and delta for HSL calculation
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  let s = 0;
  let l = (max + min) / 2;

  if (delta === 0) {
    // Achromatic (grayscale)
    h = 0;
    s = 0;
  } else {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    switch (max) {
      case r:
        h = (g - b) / delta + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / delta + 2;
        break;
      case b:
        h = (r - g) / delta + 4;
        break;
    }
    h /= 6;
  }

  // Convert HSL values to their respective ranges (h: [0, 360], s: [0, 100], l: [0, 100])
  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);

  return { h, s, l };
}

// Convert HSL to hex with improved precision for neutral colors
function hslToHex(hsl: { h: number; s: number; l: number }): string {
  const { h, s, l } = hsl;
  const hNorm = h / 360;
  const sNorm = s / 100;
  const lNorm = l / 100;

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  let r: number, g: number, b: number;

  if (sNorm === 0 || sNorm < 0.001) {
    // For achromatic or very low saturation, ensure pure grayscale
    r = g = b = lNorm;
  } else {
    const q = lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm + sNorm - lNorm * sNorm;
    const p = 2 * lNorm - q;
    r = hue2rgb(p, q, hNorm + 1 / 3);
    g = hue2rgb(p, q, hNorm);
    b = hue2rgb(p, q, hNorm - 1 / 3);
  }

  const toHex = (c: number) => {
    // Improved precision: ensure values are properly clamped and rounded
    const clamped = Math.max(0, Math.min(1, c));
    const hex = Math.round(clamped * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Removed unused function determineShadePosition - was not called anywhere

export function completeHexCode(hex: string): string {
  hex = hex.startsWith("#") ? hex : `#${hex}`;
  hex = hex.substring(1);
  if (hex.length === 3) {
    return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`;
  }
  if (hex.length < 6) {
    return `#${hex.padEnd(6, "0")}`;
  }
  return `#${hex.substring(0, 6)}`;
}

export type Shade =
  | "50"
  | "100"
  | "200"
  | "300"
  | "400"
  | "500"
  | "600"
  | "700"
  | "800"
  | "900"
  | "950";
const Shades: Shade[] = [
  "50",
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900",
  "950",
];

/**
 * Accent bases with very low saturation (zinc, slate, stone, ash).
 * Offset-from-500 lightness math skews light shades too dark; use fixed neutral ramp instead.
 */
const NEUTRAL_LIKE_SATURATION_THRESHOLD = 10;

const NEUTRAL_11_SHADE_LIGHTNESS = [97, 91, 83, 72, 60, 48, 36, 25, 16, 9, 4];
const NEUTRAL_11_DARK_SHADE_LIGHTNESS = [4, 9, 16, 25, 36, 48, 60, 72, 83, 91, 97];

function resolveNeutralBaseSaturation(hsl: { s: number }): number {
  return Math.min(hsl.s * 0.15, 8);
}

function neutralSaturationAtLightness(
  lightness: number,
  baseSaturation: number,
): number {
  if (baseSaturation === 0) return 0;

  const normalizedL = lightness / 100;
  let saturationMultiplier: number;
  if (normalizedL < 0.3) {
    saturationMultiplier = 1 - normalizedL * 0.2;
  } else if (normalizedL < 0.5) {
    saturationMultiplier = 0.8 - (normalizedL - 0.3) * 1;
  } else if (normalizedL < 0.7) {
    saturationMultiplier = 0.6 - (normalizedL - 0.5) * 1;
  } else {
    saturationMultiplier = 0.4 - (normalizedL - 0.7) * 0.67;
  }

  return Math.max(baseSaturation * saturationMultiplier, 0.5);
}

function buildNeutralAnchoredPaletteFromBase(
  safeHex: string,
  hsl: { h: number; s: number; l: number },
): {
  palette: Record<Shade, string>;
  darkpalette: Record<Shade, string>;
  hslValues: Record<"palette" | "darkpalette", Record<Shade, string>>;
  lightnessTypeMap: {
    palette: Record<Shade, "light" | "dark">;
    darkpalette: Record<Shade, "light" | "dark">;
  };
} {
  const baseSaturation = resolveNeutralBaseSaturation(hsl);
  const palette = {} as Record<Shade, string>;
  const darkpalette = {} as Record<Shade, string>;
  const hslValues: Record<"palette" | "darkpalette", Record<Shade, string>> = {
    palette: {} as Record<Shade, string>,
    darkpalette: {} as Record<Shade, string>,
  };
  const lightnessTypeMap: {
    palette: Record<Shade, "light" | "dark">;
    darkpalette: Record<Shade, "light" | "dark">;
  } = {
    palette: {} as Record<Shade, "light" | "dark">,
    darkpalette: {} as Record<Shade, "light" | "dark">,
  };

  Shades.forEach((shade, index) => {
    const lightL = NEUTRAL_11_SHADE_LIGHTNESS[index];
    let lightSat = neutralSaturationAtLightness(lightL, baseSaturation);
    if (baseSaturation > 0) lightSat = Math.max(lightSat, 1);

    const lightHex =
      shade === "500"
        ? safeHex
        : hslToHex({ h: hsl.h, s: lightSat, l: lightL });
    palette[shade] = lightHex;
    hslValues.palette[shade] = `${hsl.h}, ${lightSat.toFixed(1)}, ${lightL}`;
    lightnessTypeMap.palette[shade] = isLightColorByWCAG(lightHex)
      ? "light"
      : "dark";

    const darkL = NEUTRAL_11_DARK_SHADE_LIGHTNESS[index];
    let darkSat = neutralSaturationAtLightness(darkL, baseSaturation);
    if (baseSaturation > 0) darkSat = Math.max(darkSat, 1);

    const darkHex =
      shade === "500"
        ? safeHex
        : hslToHex({ h: hsl.h, s: darkSat, l: darkL });
    darkpalette[shade] = darkHex;
    hslValues.darkpalette[shade] =
      `${hsl.h}, ${darkSat.toFixed(1)}, ${darkL}`;
    lightnessTypeMap.darkpalette[shade] = isLightColorByWCAG(darkHex)
      ? "light"
      : "dark";
  });

  return { palette, darkpalette, hslValues, lightnessTypeMap };
}

export function generatePalette(
  baseHex: string,
  treatAsBase500?: boolean,
): {
  palette: Record<Shade, string>;
  darkpalette: Record<Shade, string>;
  hslValues?: Record<"palette" | "darkpalette", Record<Shade, string>>;
  detectedShade: Shade;
  isValidHex: boolean;
  safeHex: string;
  isLight: boolean;
  lightnessTypeMap: {
    palette: Record<Shade, "light" | "dark">;
    darkpalette: Record<Shade, "light" | "dark">;
  };
} {
  const safeHex = completeHexCode(baseHex);
  const isValid = /^#[0-9A-Fa-f]{6}$/.test(safeHex);
  const isLight = isLightColorByWCAG(safeHex);

  // Prepare lightness type maps for both palettes
  const lightnessTypeMap: {
    palette: Record<Shade, "light" | "dark">;
    darkpalette: Record<Shade, "light" | "dark">;
  } = {
    palette: {} as Record<Shade, "light" | "dark">,
    darkpalette: {} as Record<Shade, "light" | "dark">,
  };

  let hslValues: Record<"palette" | "darkpalette", Record<Shade, string>> = {
    palette: {} as Record<Shade, string>,
    darkpalette: {} as Record<Shade, string>,
  };

  // Tailwind-exact lightness values for each shade
  const tailwindLightness = [
    97.3, 92.4, 84.7, 74.9, 64.9, 54.5, 45.1, 36.3, 27.1, 17.6, 10.6,
  ];

  const tailwindSaturationModifiers = [
    0.95, 0.97, 0.99, 1.0, 1.01, 1.0, 0.98, 0.96, 0.94, 0.92, 0.9,
  ];

  const tailwindHueShifts = [0, 0, 0, 0, 0, 0, -1, -2, -3, -4, -5];

  const hsl = hexToHsl(safeHex);
  const detectedShade: Shade = "500";

  if (treatAsBase500 && hsl.s <= NEUTRAL_LIKE_SATURATION_THRESHOLD) {
    const neutralAnchored = buildNeutralAnchoredPaletteFromBase(safeHex, hsl);
    return {
      ...neutralAnchored,
      detectedShade,
      isValidHex: isValid,
      safeHex,
      isLight,
    };
  }

  const resolveTargetLightness = (index: number): number =>
    tailwindLightness[index];

  const buildShadeColor = (index: number, shade: Shade): string => {
    if (treatAsBase500 && shade === "500") return safeHex;

    const targetLightness = resolveTargetLightness(index);
    let targetSaturation = Math.min(
      hsl.s * tailwindSaturationModifiers[index],
      100,
    );
    let targetHue = hsl.h;

    if (hsl.h > 15 && hsl.h < 340) {
      targetHue = (hsl.h + tailwindHueShifts[index] + 360) % 360;
    }

    return hslToHex({
      h: targetHue,
      s: targetSaturation,
      l: targetLightness,
    });
  };

  const palette: Record<Shade, string> = {} as Record<Shade, string>;

  // Generate the main palette using Tailwind's exact methodology
  Shades.forEach((shade, index) => {
    const targetLightness = resolveTargetLightness(index);
    let targetSaturation = Math.min(
      hsl.s * tailwindSaturationModifiers[index],
      100,
    );
    let targetHue = hsl.h;

    // Apply subtle hue shifts for warmer colors (avoiding pure reds and magentas)
    if (hsl.h > 15 && hsl.h < 340) {
      targetHue = (hsl.h + tailwindHueShifts[index] + 360) % 360;
    }

    const colorHex = buildShadeColor(index, shade);

    palette[shade] = colorHex;
    hslValues.palette[shade] =
      `${targetHue}, ${targetSaturation}, ${targetLightness}`;
    lightnessTypeMap.palette[shade] = isLightColorByWCAG(colorHex)
      ? "light"
      : "dark";
  });

  // Generate dark palette (identical to light palette for Tailwind consistency)
  const darkpalette: Record<Shade, string> = {} as Record<Shade, string>;
  Shades.forEach((shade, index) => {
    const targetLightness = resolveTargetLightness(index);
    let targetSaturation = Math.min(
      hsl.s * tailwindSaturationModifiers[index],
      100,
    );
    let targetHue = hsl.h;

    if (hsl.h > 15 && hsl.h < 340) {
      targetHue = (hsl.h + tailwindHueShifts[index] + 360) % 360;
    }

    const colorHex = buildShadeColor(index, shade);

    darkpalette[shade] = colorHex;
    hslValues.darkpalette[shade] =
      `${targetHue}, ${targetSaturation}, ${targetLightness}`;
    lightnessTypeMap.darkpalette[shade] = isLightColorByWCAG(colorHex)
      ? "light"
      : "dark";
  });

  return {
    palette,
    darkpalette,
    hslValues,
    detectedShade,
    isValidHex: isValid,
    safeHex,
    isLight,
    lightnessTypeMap,
  };
}
function wcagLuminance(hex: string): number {
  const hexVal = hex.replace("#", "");
  const r = parseInt(hexVal.slice(0, 2), 16) / 255;
  const g = parseInt(hexVal.slice(2, 4), 16) / 255;
  const b = parseInt(hexVal.slice(4, 6), 16) / 255;

  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  const R = toLinear(r);
  const G = toLinear(g);
  const B = toLinear(b);

  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function contrastRatio(lum1: number, lum2: number): number {
  const L1 = Math.max(lum1, lum2);
  const L2 = Math.min(lum1, lum2);
  return (L1 + 0.05) / (L2 + 0.05);
}

function isLightColorByWCAG(hex: string): boolean {
  const lum = wcagLuminance(hex);
  const contrastWithBlack = contrastRatio(lum, 0);
  const contrastWithWhite = contrastRatio(lum, 1);

  return contrastWithBlack >= contrastWithWhite;
}

/**
 * Generates a neutral palette with sophisticated saturation handling.
 * For colored neutrals, applies subtle saturation that:
 * - Is higher in darker shades (more noticeable in shadows)
 * - Lower in lighter shades (maintains clean appearance)
 * - Scales based on the original color's saturation
 * - Maintains grayish appearance while adding warmth
 * @param baseHex Optional base color to derive hue and saturation from
 * @returns Object containing various neutral palette formats
 */
export function generateNeutralPalette(baseHex?: string): {
  palette: Record<string, string>;
  hslValues: Record<string, string>;
  palette11: Record<string, string>;
  darkpalette11: Record<string, string>;
  hslValues11: Record<string, string>;
  grayPalette: Record<string, string>;
  grayHslValues: Record<string, string>;
} {
  let hue = 0;
  let baseSaturation = 0;

  // Extract hue and saturation from base color if provided
  if (baseHex && hexToHsl(completeHexCode(baseHex)).s !== 0) {
    const safeHex = completeHexCode(baseHex);
    const hsl = hexToHsl(safeHex);
    hue = hsl.h;
    baseSaturation = resolveNeutralBaseSaturation(hsl);
  }

  const calculateNeutralSaturation = (lightness: number): number =>
    neutralSaturationAtLightness(lightness, baseSaturation);

  const palette: Record<string, string> = {};
  const hslValues: Record<string, string> = {};
  const palette11: Record<string, string> = {};
  const hslValues11: Record<string, string> = {};
  const darkpalette11: Record<string, string> = {};

  // Neutral steps (2, 4, ..., 98) with dynamic saturation
  for (let l = 2; l <= 98; l += 2) {
    const saturation = calculateNeutralSaturation(l);
    palette[`${l}`] = hslToHex({ h: hue, s: saturation, l });
    hslValues[`${l}`] = `${hue}, ${saturation}, ${l}`;
  }

  const shadeKeys = Shades;

  // Light mode palette with improved saturation handling
  for (let i = 0; i < shadeKeys.length; i++) {
    const l = NEUTRAL_11_SHADE_LIGHTNESS[i];
    let saturation = calculateNeutralSaturation(l);

    // Ensure minimum contrast between adjacent shades
    if (baseSaturation > 0) {
      // For colored neutrals, ensure at least 1% saturation to maintain distinctness
      saturation = Math.max(saturation, 1);
    }

    palette11[shadeKeys[i]] = hslToHex({ h: hue, s: saturation, l });
    hslValues11[shadeKeys[i]] = `${hue}, ${saturation.toFixed(1)}, ${l}`;
  }

  // Dark mode palette (inverted lightness but same saturation logic)
  for (let i = 0; i < shadeKeys.length; i++) {
    const l = NEUTRAL_11_DARK_SHADE_LIGHTNESS[i];
    let saturation = calculateNeutralSaturation(l);

    // Ensure minimum contrast for dark mode as well
    if (baseSaturation > 0) {
      saturation = Math.max(saturation, 1);
    }

    darkpalette11[shadeKeys[i]] = hslToHex({ h: hue, s: saturation, l });
  }

  // Theme gray palette: `gray-{N}` → HSL(0, 0%, N%) exactly (token index === lightness L).
  // Independent of hue/sat from the neutral base — pure grayscale for predictable design tokens.
  const grayPalette: Record<string, string> = {};
  const grayHslValues: Record<string, string> = {};

  for (let step = 2; step <= 98; step += 2) {
    grayPalette[`${step}`] = hslToHex({ h: 0, s: 0, l: step });
    grayHslValues[`${step}`] = `0, 0, ${step}`;
  }

  return {
    palette,
    hslValues,
    palette11,
    hslValues11,
    darkpalette11,
    grayPalette,
    grayHslValues,
  };
}
