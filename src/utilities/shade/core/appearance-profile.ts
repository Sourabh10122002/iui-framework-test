import type { Appearance, Scheme } from "./dimensions";

/** Channel-isolated appearance anchors — consumed by canonical-resolver.ts only. */
export type AppearanceProfile = {
  fill: number;
  text: number | "white" | "black";
  border: number;
  outline: number;
  ring: number;
};

const LIGHT_PROFILES: Record<Appearance, AppearanceProfile> = {
  strong: { fill: 500, text: "white", border: 700, outline: 700, ring: 500 },
  soft: { fill: 100, text: 700, border: 300, outline: 300, ring: 500 },
  dualTone: { fill: 50, text: 700, border: 400, outline: 400, ring: 500 },
  onColor: { fill: 0, text: 500, border: 300, outline: 300, ring: 500 },
};

const DARK_PROFILES: Record<Appearance, AppearanceProfile> = {
  strong: { fill: 400, text: "black", border: 200, outline: 200, ring: 400 },
  soft: { fill: 950, text: 300, border: 700, outline: 700, ring: 400 },
  dualTone: { fill: 900, text: 300, border: 700, outline: 700, ring: 400 },
  onColor: { fill: 1000, text: 400, border: 700, outline: 700, ring: 400 },
};

export const resolveAppearanceProfile = (
  appearance: Appearance,
  scheme: Scheme,
): AppearanceProfile =>
  scheme === "dark" ? DARK_PROFILES[appearance] : LIGHT_PROFILES[appearance];
