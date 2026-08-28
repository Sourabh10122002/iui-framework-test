import {
  mapFont,
  mapRadius,
  mapSpacingClass,
  mapSpacingToPadding,
} from "../utilities/theme-utilities";

const SPACING_PRESETS = ["compact", "standard", "spacious"];
const RADIUS_PRESETS = ["none", "sm", "md", "lg", "full", "stone", "cloud", "circle"];
const FONT_PRESETS = ["inter", "arial", "mono"];

function addTokens(value: string, target: Set<string>): void {
  value
    .split(/\s+/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .forEach((token) => target.add(token));
}

export function expandThemeUtilityClasses(): Set<string> {
  const classes = new Set<string>();

  SPACING_PRESETS.forEach((spacing) => {
    addTokens(mapSpacingClass(spacing), classes);
    addTokens(mapSpacingToPadding(spacing), classes);
  });

  RADIUS_PRESETS.forEach((radius) => {
    addTokens(mapRadius(radius), classes);
  });

  FONT_PRESETS.forEach((font) => {
    addTokens(mapFont(font), classes);
  });

  return classes;
}
