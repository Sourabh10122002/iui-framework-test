export type Pattern = "interactive" | "surface" | "field" | "mark" | "chrome";

export type Variant =
  | "solid"
  | "outline"
  | "solidOutline"
  | "ghost"
  | "underline"
  | "solidUnderline";

export type Appearance = "strong" | "soft" | "dualTone" | "onColor";

export type State =
  | "default"
  | "hover"
  | "pressed"
  | "selected"
  | "disabled"
  | "focus"
  | "error"
  | "loading"
  | "indeterminate";

export type Channel =
  | "fill"
  | "text"
  | "border"
  | "outline"
  | "ring"
  | "indicator"
  | "container"
  | "track"
  | "thumb"
  | "arrow"
  | "full";

export type PaletteClass = "chromatic" | "neutral" | "literal";
export type Scheme = "light" | "dark";

export interface EmitConfig {
  adaptive?: boolean;
  scheme?: Scheme;
}

export interface SemanticRequest {
  pattern: Pattern;
  variant: Variant;
  appearance: Appearance;
  state: State;
  channel?: Channel;
  palette: string;
  emit?: EmitConfig;
}

export const DEFAULT_EMIT: Required<EmitConfig> = {
  adaptive: true,
  scheme: "light",
};

const VARIANT_ALIAS: Record<string, Variant> = {
  solid: "solid",
  "solid-outline": "solidOutline",
  solidoutline: "solidOutline",
  "solid_outline": "solidOutline",
  "filled+outlined": "solidOutline",
  filledoutlined: "solidOutline",
  "solid+outline": "solidOutline",
  outline: "outline",
  outlined: "outline",
  ghost: "ghost",
  transparent: "ghost",
  underline: "underline",
  underlined: "underline",
  "solid-underline": "solidUnderline",
  solidunderline: "solidUnderline",
  "filled+underlined": "solidUnderline",
};

const APPEARANCE_ALIAS: Record<string, Appearance> = {
  strong: "strong",
  classic: "strong",
  soft: "soft",
  subtle: "soft",
  dualtone: "dualTone",
  "dual-tone": "dualTone",
  dualTone: "dualTone",
  oncolor: "onColor",
  onColor: "onColor",
  "on-color": "onColor",
};

export const normalizePalette = (palette: string): string => {
  if (
    palette === "warm" ||
    palette === "warm-neutral" ||
    palette === "cool" ||
    palette === "cold" ||
    palette === "cold-neutral" ||
    palette === "cool-neutral"
  ) {
    return "neutral";
  }
  return palette.trim();
};

export const normalizeVariant = (variant: string): Variant =>
  VARIANT_ALIAS[variant] ?? VARIANT_ALIAS[variant.toLowerCase()] ?? "solid";

export const normalizeAppearance = (appearance: string): Appearance =>
  APPEARANCE_ALIAS[appearance] ??
  APPEARANCE_ALIAS[appearance.toLowerCase()] ??
  "strong";

export const toLegacyVariant = (variant: Variant): string => {
  if (variant === "solidOutline") return "solid-outline";
  if (variant === "solidUnderline") return "solid-underline";
  return variant;
};

export const assertNever = (value: never): never => {
  throw new Error(`Unreachable value: ${String(value)}`);
};
