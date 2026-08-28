import type { Channel, Pattern, State } from "./dimensions";

type Rule = {
  states: readonly State[];
  channels: readonly Channel[];
};

const ALL_STATES: readonly State[] = [
  "default",
  "hover",
  "pressed",
  "selected",
  "disabled",
  "focus",
  "error",
  "loading",
  "indeterminate",
];

const SURFACE_STATES: readonly State[] = ["default", "disabled", "error"];
const MARK_STATES: readonly State[] = [
  "default",
  "hover",
  "pressed",
  "selected",
  "disabled",
  "indeterminate",
];
const CHROME_STATES: readonly State[] = ["default", "hover", "pressed", "disabled"];

const INTERACTIVE_CHANNELS: readonly Channel[] = [
  "fill",
  "text",
  "border",
  "outline",
  "ring",
  "full",
];
const SURFACE_CHANNELS: readonly Channel[] = [
  "fill",
  "text",
  "border",
  "outline",
  "ring",
  "container",
  "full",
];
const FIELD_CHANNELS: readonly Channel[] = [
  "fill",
  "text",
  "border",
  "outline",
  "ring",
  "container",
  "full",
];
const MARK_CHANNELS: readonly Channel[] = [
  "indicator",
  "container",
  "fill",
  "text",
  "border",
  "outline",
  "ring",
  "full",
];
const CHROME_CHANNELS: readonly Channel[] = [
  "track",
  "thumb",
  "arrow",
  "fill",
  "text",
  "border",
  "outline",
  "ring",
  "full",
];

export const PATTERN_RULES: Record<Pattern, Rule> = {
  interactive: { states: ALL_STATES, channels: INTERACTIVE_CHANNELS },
  surface: { states: SURFACE_STATES, channels: SURFACE_CHANNELS },
  field: { states: ALL_STATES, channels: FIELD_CHANNELS },
  mark: { states: MARK_STATES, channels: MARK_CHANNELS },
  chrome: { states: CHROME_STATES, channels: CHROME_CHANNELS },
};

export const validatePatternStateChannel = (
  pattern: Pattern,
  state: State,
  channel: Channel,
): void => {
  const rules = PATTERN_RULES[pattern];
  if (!rules.states.includes(state)) {
    throw new Error(`State "${state}" is not valid for pattern "${pattern}"`);
  }
  if (!rules.channels.includes(channel)) {
    throw new Error(`Channel "${channel}" is not valid for pattern "${pattern}"`);
  }
};
