import type { Channel, Pattern, Scheme, SemanticRequest } from "./dimensions";
import { classifyPalette } from "./palette-classify";
import { resolveInteractiveTokens } from "./interactive-recipe";
import { resolveLiteralTokens, type ChannelTokenMap } from "./literal-transform";
import { resolveAppearanceProfile } from "./appearance-profile";
import { resolveProgression } from "./state-progression";

const SHADE_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

const clampShade = (value: number): number => {
  if (value <= 50) return 50;
  if (value >= 950) return 950;
  let nearest = SHADE_STEPS[0];
  let distance = Math.abs(value - nearest);
  for (const step of SHADE_STEPS) {
    const nextDistance = Math.abs(value - step);
    if (nextDistance < distance) {
      nearest = step;
      distance = nextDistance;
    }
  }
  return nearest;
};

const mapInteractiveTokens = (tokens: {
  fill: string;
  text: string;
  outline?: string;
  border?: string;
  ring?: string;
}): ChannelTokenMap => ({
  fill: tokens.fill,
  text: tokens.text,
  border: tokens.border ?? tokens.outline ?? tokens.fill,
  outline: tokens.outline ?? tokens.text,
  ring: tokens.ring ?? tokens.outline ?? tokens.fill,
});

const resolveOnColorFill = (
  appearance: SemanticRequest["appearance"],
  scheme: Scheme,
): string => {
  if (appearance !== "onColor") return "";
  if (scheme === "dark") return "black";
  return "white";
};

const resolveChannelIsolatedTokens = (
  req: SemanticRequest,
  scheme: Scheme,
): ChannelTokenMap => {
  const appearance = resolveAppearanceProfile(req.appearance, scheme);
  const progression = resolveProgression(req.pattern, req.state, scheme);
  const onColorFill = resolveOnColorFill(req.appearance, scheme);
  const toToken = (base: number | "white" | "black", delta: number): string => {
    if (base === "white" || base === "black") return base;
    return String(clampShade(base + delta));
  };

  const fill = onColorFill || toToken(appearance.fill, progression.fill);
  const text = toToken(appearance.text, progression.text);
  const border = toToken(appearance.border, progression.border);
  const outline = toToken(appearance.outline, progression.outline);
  const ring = toToken(appearance.ring, progression.ring);

  return { fill, text, border, outline, ring };
};

const usesComposedTokenTables = (
  pattern: Pattern,
  channel: Channel,
  variant: SemanticRequest["variant"],
): boolean =>
  pattern === "interactive" ||
  (pattern === "surface" &&
    (channel === "full" ||
      variant === "underline" ||
      variant === "solidUnderline"));

/**
 * Single token authority for shade composition.
 * Composed tables (interactive token steps) drive full-stack and interactive
 * channel requests. Channel-isolated profile tables drive sliced surface,
 * field, mark, and chrome requests.
 */
export const resolveCanonicalTokens = (
  req: SemanticRequest,
  scheme: Scheme,
): ChannelTokenMap => {
  const channel = req.channel ?? "full";
  const paletteInfo = classifyPalette(req.palette);

  if (
    paletteInfo.paletteClass === "literal" &&
    paletteInfo.normalized === "transparent" &&
    !usesComposedTokenTables(req.pattern, channel, req.variant)
  ) {
    return resolveLiteralTokens(
      "transparent",
      req.appearance,
      req.state,
      scheme,
    );
  }

  if (usesComposedTokenTables(req.pattern, channel, req.variant)) {
    const surfaceReq =
      req.pattern === "surface"
        ? { ...req, state: "default" as const }
        : req;
    const resolved = resolveInteractiveTokens(surfaceReq, paletteInfo, scheme);
    return mapInteractiveTokens(resolved);
  }

  if (paletteInfo.paletteClass === "literal") {
    return resolveLiteralTokens(
      paletteInfo.normalized as "white" | "black" | "transparent",
      req.appearance,
      req.state,
      scheme,
    );
  }

  return resolveChannelIsolatedTokens(req, scheme);
};
