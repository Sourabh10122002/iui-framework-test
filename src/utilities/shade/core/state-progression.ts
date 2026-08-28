import type { Pattern, Scheme, State } from "./dimensions";

/** Channel-isolated state progression deltas — consumed by canonical-resolver.ts only. */
export type ProgressionDelta = {
  fill: number;
  text: number;
  border: number;
  outline: number;
  ring: number;
};

const ZERO: ProgressionDelta = {
  fill: 0,
  text: 0,
  border: 0,
  outline: 0,
  ring: 0,
};

const INTERACTIVE_LIGHT: Record<State, ProgressionDelta> = {
  default: ZERO,
  hover: { fill: 100, text: 0, border: 100, outline: 100, ring: 0 },
  pressed: { fill: 200, text: 0, border: 200, outline: 200, ring: 0 },
  selected: { fill: 100, text: 0, border: 100, outline: 100, ring: 100 },
  disabled: { fill: -200, text: 0, border: -200, outline: -200, ring: -200 },
  focus: { fill: 0, text: 0, border: 0, outline: 0, ring: 200 },
  error: { fill: 0, text: 0, border: 200, outline: 200, ring: 200 },
  loading: { fill: -100, text: 0, border: -100, outline: -100, ring: 0 },
  indeterminate: { fill: 100, text: 0, border: 100, outline: 100, ring: 100 },
};

const INTERACTIVE_DARK: Record<State, ProgressionDelta> = {
  default: ZERO,
  hover: { fill: -100, text: 0, border: -100, outline: -100, ring: 0 },
  pressed: { fill: -200, text: 0, border: -200, outline: -200, ring: 0 },
  selected: { fill: -100, text: 0, border: -100, outline: -100, ring: -100 },
  disabled: { fill: 100, text: 0, border: 100, outline: 100, ring: 100 },
  focus: { fill: 0, text: 0, border: 0, outline: 0, ring: -200 },
  error: { fill: 0, text: 0, border: 200, outline: 200, ring: 200 },
  loading: { fill: 100, text: 0, border: 100, outline: 100, ring: 0 },
  indeterminate: { fill: -100, text: 0, border: -100, outline: -100, ring: -100 },
};

const SURFACE_LIGHT: Record<State, ProgressionDelta> = {
  ...INTERACTIVE_LIGHT,
  hover: ZERO,
  pressed: ZERO,
  selected: ZERO,
  focus: ZERO,
  loading: ZERO,
  indeterminate: ZERO,
};

const SURFACE_DARK: Record<State, ProgressionDelta> = {
  ...INTERACTIVE_DARK,
  hover: ZERO,
  pressed: ZERO,
  selected: ZERO,
  focus: ZERO,
  loading: ZERO,
  indeterminate: ZERO,
};

const MARK_LIGHT: Record<State, ProgressionDelta> = {
  ...INTERACTIVE_LIGHT,
  selected: { fill: 200, text: 0, border: 200, outline: 200, ring: 200 },
  indeterminate: { fill: 200, text: 0, border: 200, outline: 200, ring: 200 },
};

const MARK_DARK: Record<State, ProgressionDelta> = {
  ...INTERACTIVE_DARK,
  selected: { fill: -200, text: 0, border: -200, outline: -200, ring: -200 },
  indeterminate: { fill: -200, text: 0, border: -200, outline: -200, ring: -200 },
};

const PATTERN_PROGRESSIONS: Record<
  Pattern,
  Record<Scheme, Record<State, ProgressionDelta>>
> = {
  interactive: { light: INTERACTIVE_LIGHT, dark: INTERACTIVE_DARK },
  field: { light: INTERACTIVE_LIGHT, dark: INTERACTIVE_DARK },
  surface: { light: SURFACE_LIGHT, dark: SURFACE_DARK },
  mark: { light: MARK_LIGHT, dark: MARK_DARK },
  chrome: { light: INTERACTIVE_LIGHT, dark: INTERACTIVE_DARK },
};

export const resolveProgression = (
  pattern: Pattern,
  state: State,
  scheme: Scheme,
): ProgressionDelta => PATTERN_PROGRESSIONS[pattern][scheme][state];
