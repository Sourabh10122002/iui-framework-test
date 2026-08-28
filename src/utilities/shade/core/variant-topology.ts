import type { Channel, Variant } from "./dimensions";

type Topology = {
  activeChannels: readonly Exclude<Channel, "full">[];
};

export const VARIANT_TOPOLOGY: Record<Variant, Topology> = {
  solid: {
    activeChannels: ["fill", "text", "ring"],
  },
  outline: {
    activeChannels: ["text", "border", "outline", "ring"],
  },
  solidOutline: {
    activeChannels: ["fill", "text", "border", "outline", "ring"],
  },
  ghost: {
    activeChannels: ["text", "ring"],
  },
  underline: {
    activeChannels: ["text", "border", "ring"],
  },
  solidUnderline: {
    activeChannels: ["fill", "text", "border", "ring"],
  },
};

const CHANNEL_ALIAS: Record<Exclude<Channel, "full">, Exclude<Channel, "full">> = {
  fill: "fill",
  text: "text",
  border: "border",
  outline: "outline",
  ring: "ring",
  indicator: "fill",
  container: "border",
  track: "fill",
  thumb: "fill",
  arrow: "text",
};

export const normalizeChannelToCore = (
  channel: Exclude<Channel, "full">,
): Exclude<Channel, "full"> => CHANNEL_ALIAS[channel];

export const resolveActiveChannels = (
  variant: Variant,
  channel: Channel,
): readonly Exclude<Channel, "full">[] => {
  if (channel === "full") {
    return VARIANT_TOPOLOGY[variant].activeChannels;
  }
  const normalized = normalizeChannelToCore(channel);
  const active = VARIANT_TOPOLOGY[variant].activeChannels;
  return active.includes(normalized) ? [normalized] : [];
};
