import type {
  Appearance,
  Channel,
  Pattern,
  Scheme,
  SemanticRequest,
  State,
  Variant,
} from "../core/dimensions";
import { PATTERN_RULES } from "../core/patterns";

const PATTERNS: Pattern[] = ["interactive", "surface", "field", "mark", "chrome"];
const VARIANTS: Variant[] = [
  "solid",
  "outline",
  "solidOutline",
  "ghost",
  "underline",
  "solidUnderline",
];
const APPEARANCES: Appearance[] = ["strong", "soft", "dualTone", "onColor"];
const PALETTES = [
  "brand",
  "danger",
  "success",
  "warning",
  "info",
  "neutral",
  "white",
  "black",
  "transparent",
  "accent-1",
] as const;
const SCHEMES: Scheme[] = ["light", "dark"];

export interface CanonicalMatrixCase {
  request: SemanticRequest;
  adaptive: boolean;
  scheme: Scheme;
}

const isMatrixCaseSupported = (
  pattern: Pattern,
  variant: Variant,
  channel: Channel,
): boolean => {
  if (
    variant === "solid" ||
    variant === "outline" ||
    variant === "solidOutline" ||
    variant === "ghost"
  ) {
    return true;
  }
  return (
    (pattern === "interactive" || pattern === "surface") &&
    channel === "full"
  );
};

const validStates = (pattern: Pattern): readonly State[] => PATTERN_RULES[pattern].states;
const validChannels = (pattern: Pattern): readonly Channel[] => PATTERN_RULES[pattern].channels;

const buildCanonicalMatrix = (): CanonicalMatrixCase[] => {
  const rows: CanonicalMatrixCase[] = [];

  for (const pattern of PATTERNS) {
    for (const variant of VARIANTS) {
      for (const appearance of APPEARANCES) {
        for (const state of validStates(pattern)) {
          for (const channel of validChannels(pattern)) {
            if (!isMatrixCaseSupported(pattern, variant, channel)) continue;
            for (const palette of PALETTES) {
              for (const adaptive of [true, false] as const) {
                for (const scheme of SCHEMES) {
                  rows.push({
                    request: {
                      pattern,
                      variant,
                      appearance,
                      state,
                      channel,
                      palette,
                      emit: adaptive ? { adaptive: true } : { adaptive: false, scheme },
                    },
                    adaptive,
                    scheme,
                  });
                }
              }
            }
          }
        }
      }
    }
  }

  return rows;
};

export const CANONICAL_MATRIX = buildCanonicalMatrix();
