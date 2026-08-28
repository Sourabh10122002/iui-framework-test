import type {
  Appearance,
  Channel,
  Pattern,
  State,
  Variant,
} from "../core/dimensions";

/** Semantic matrix fixtures for shade compatibility and API tests. */
export const SHADE_PALETTES = ["brand", "danger", "neutral", "white", "black"] as const;
const PATTERNS: Pattern[] = ["interactive", "surface", "field", "mark", "chrome"];
const VARIANTS: Variant[] = ["solid", "outline", "solidOutline", "ghost"];
const APPEARANCES: Appearance[] = ["strong", "soft", "dualTone", "onColor"];
const STATES: State[] = ["default", "hover", "pressed", "selected"];
const CHANNELS: Channel[] = ["full", "fill", "text", "border"];

export interface SemanticMatrixCase {
  pattern: Pattern;
  variant: Variant;
  appearance: Appearance;
  state: State;
  channel: Channel;
  palette: (typeof SHADE_PALETTES)[number];
  adaptive: boolean;
}

const isValid = (entry: SemanticMatrixCase): boolean => {
  if (entry.pattern === "surface" && entry.state !== "default") return false;
  if (entry.pattern === "field" && !["default", "focus", "error", "disabled"].includes(entry.state)) return false;
  if (entry.pattern === "mark" && !["default", "hover", "selected", "disabled", "indeterminate"].includes(entry.state)) {
    return false;
  }
  if (entry.pattern === "chrome" && !["default", "hover", "pressed", "disabled"].includes(entry.state)) {
    return false;
  }
  if (entry.pattern === "chrome" && !["full", "fill", "text", "border"].includes(entry.channel)) return false;
  return true;
};

const buildSemanticMatrix = (): SemanticMatrixCase[] => {
  const entries: SemanticMatrixCase[] = [];
  for (const pattern of PATTERNS) {
    for (const variant of VARIANTS) {
      for (const appearance of APPEARANCES) {
        for (const state of STATES) {
          for (const channel of CHANNELS) {
            for (const palette of SHADE_PALETTES) {
              for (const adaptive of [false, true] as const) {
                const candidate: SemanticMatrixCase = {
                  pattern,
                  variant,
                  appearance,
                  state,
                  channel,
                  palette,
                  adaptive,
                };
                if (isValid(candidate)) {
                  entries.push(candidate);
                }
              }
            }
          }
        }
      }
    }
  }
  return entries;
};

export const SEMANTIC_MATRIX = buildSemanticMatrix();
