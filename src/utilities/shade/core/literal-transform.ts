import type { Appearance, Scheme, State } from "./dimensions";

/** Literal palette channel-isolated tables — consumed by canonical-resolver.ts only. */
export type ChannelTokenMap = {
  fill: string;
  text: string;
  border: string;
  outline: string;
  ring: string;
};

type LiteralPalette = "white" | "black" | "transparent";

const WHITE_LIGHT: Record<Appearance, ChannelTokenMap> = {
  strong: { fill: "white", text: "black", border: "neutral-200", outline: "neutral-200", ring: "white" },
  soft: { fill: "neutral-50", text: "neutral-900", border: "neutral-200", outline: "neutral-200", ring: "neutral-100" },
  dualTone: { fill: "neutral-100", text: "neutral-900", border: "neutral-300", outline: "neutral-300", ring: "neutral-200" },
  onColor: { fill: "white", text: "neutral-900", border: "neutral-300", outline: "neutral-300", ring: "white" },
};

const WHITE_DARK: Record<Appearance, ChannelTokenMap> = {
  strong: { fill: "black", text: "white", border: "neutral-700", outline: "neutral-700", ring: "neutral-700" },
  soft: { fill: "neutral-900", text: "neutral-100", border: "neutral-700", outline: "neutral-700", ring: "neutral-700" },
  dualTone: { fill: "neutral-900", text: "neutral-100", border: "neutral-700", outline: "neutral-700", ring: "neutral-700" },
  onColor: { fill: "white", text: "neutral-900", border: "neutral-300", outline: "neutral-300", ring: "white" },
};

const BLACK_LIGHT: Record<Appearance, ChannelTokenMap> = {
  strong: { fill: "black", text: "white", border: "neutral-700", outline: "neutral-700", ring: "black" },
  soft: { fill: "neutral-900", text: "neutral-100", border: "neutral-700", outline: "neutral-700", ring: "neutral-800" },
  dualTone: { fill: "neutral-800", text: "neutral-100", border: "neutral-700", outline: "neutral-700", ring: "neutral-700" },
  onColor: { fill: "black", text: "neutral-100", border: "neutral-700", outline: "neutral-700", ring: "black" },
};

const BLACK_DARK: Record<Appearance, ChannelTokenMap> = {
  strong: { fill: "white", text: "black", border: "neutral-200", outline: "neutral-200", ring: "neutral-200" },
  soft: { fill: "neutral-50", text: "neutral-900", border: "neutral-200", outline: "neutral-200", ring: "neutral-100" },
  dualTone: { fill: "neutral-100", text: "neutral-900", border: "neutral-300", outline: "neutral-300", ring: "neutral-200" },
  onColor: { fill: "neutral-900", text: "neutral-50", border: "neutral-700", outline: "neutral-700", ring: "neutral-800" },
};

const TRANSPARENT_LIGHT: Record<Appearance, ChannelTokenMap> = {
  strong: { fill: "transparent", text: "neutral-900", border: "neutral-400", outline: "neutral-400", ring: "neutral-500" },
  soft: { fill: "transparent", text: "neutral-700", border: "neutral-300", outline: "neutral-300", ring: "neutral-400" },
  dualTone: { fill: "transparent", text: "neutral-700", border: "neutral-300", outline: "neutral-300", ring: "neutral-400" },
  onColor: { fill: "transparent", text: "white", border: "white/60", outline: "white/60", ring: "white" },
};

const TRANSPARENT_DARK: Record<Appearance, ChannelTokenMap> = {
  strong: { fill: "transparent", text: "neutral-100", border: "neutral-500", outline: "neutral-500", ring: "neutral-300" },
  soft: { fill: "transparent", text: "neutral-300", border: "neutral-600", outline: "neutral-600", ring: "neutral-400" },
  dualTone: { fill: "transparent", text: "neutral-300", border: "neutral-600", outline: "neutral-600", ring: "neutral-400" },
  onColor: { fill: "transparent", text: "white", border: "white/70", outline: "white/70", ring: "white" },
};

const STEP_SHIFT: Record<State, number> = {
  default: 0,
  hover: 1,
  pressed: 2,
  selected: 1,
  disabled: 0,
  focus: 0,
  error: 0,
  loading: 0,
  indeterminate: 1,
};

const scaleNeutral = (token: string, shift: number): string => {
  const match = /^neutral-(\d+)$/.exec(token);
  if (!match) return token;
  const value = Number(match[1]);
  const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  const index = steps.indexOf(value);
  if (index === -1) return token;
  const next = Math.max(0, Math.min(steps.length - 1, index + shift));
  return `neutral-${steps[next]}`;
};

const tableFor = (
  palette: LiteralPalette,
  scheme: Scheme,
): Record<Appearance, ChannelTokenMap> => {
  if (palette === "white") return scheme === "dark" ? WHITE_DARK : WHITE_LIGHT;
  if (palette === "black") return scheme === "dark" ? BLACK_DARK : BLACK_LIGHT;
  return scheme === "dark" ? TRANSPARENT_DARK : TRANSPARENT_LIGHT;
};

export const resolveLiteralTokens = (
  palette: LiteralPalette,
  appearance: Appearance,
  state: State,
  scheme: Scheme,
): ChannelTokenMap => {
  const base = tableFor(palette, scheme)[appearance];
  const shift = STEP_SHIFT[state];
  return {
    fill: base.fill,
    text: scaleNeutral(base.text, shift),
    border: scaleNeutral(base.border, shift),
    outline: scaleNeutral(base.outline, shift),
    ring: scaleNeutral(base.ring, shift),
  };
};
