import type { PaletteClass } from "./dimensions";
import { normalizePalette } from "./dimensions";

const LITERALS = new Set(["white", "black", "transparent"]);
const NEUTRALS = ["neutral"];

export type PaletteClassification = {
  input: string;
  normalized: string;
  paletteClass: PaletteClass;
};

export const classifyPalette = (palette: string): PaletteClassification => {
  const normalized = normalizePalette(palette);
  if (LITERALS.has(normalized)) {
    return { input: palette, normalized, paletteClass: "literal" };
  }
  if (NEUTRALS.some((prefix) => normalized.startsWith(prefix))) {
    return { input: palette, normalized, paletteClass: "neutral" };
  }
  return { input: palette, normalized, paletteClass: "chromatic" };
};
