import type { Appearance, Channel, Scheme, SemanticRequest } from "./dimensions";
import { DEFAULT_EMIT } from "./dimensions";
import { classifyPalette } from "./palette-classify";
import { resolveLiteralTokens, type ChannelTokenMap } from "./literal-transform";
import { resolveAppearanceProfile } from "./appearance-profile";
import { resolveProgression } from "./state-progression";
import { resolveActiveChannels } from "./variant-topology";
import { validatePatternStateChannel } from "./patterns";
import {
  composeInteractiveSemantic,
} from "./interactive-recipe";
import {
  composeSurfaceSemantic,
} from "./surface-recipe";
import { resolveCanonicalTokens } from "./canonical-resolver";

export type ComposerDispatchMode =
  | "dual"
  | "composer-only"
  | "legacy-generic-only";

let dispatchMode: ComposerDispatchMode = "composer-only";

export const setComposerDispatchMode = (mode: ComposerDispatchMode): void => {
  dispatchMode = mode;
};

export const getComposerDispatchMode = (): ComposerDispatchMode => dispatchMode;

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

const channelPrefix = (channel: Exclude<Channel, "full">): string => {
  if (channel === "fill" || channel === "indicator" || channel === "track" || channel === "thumb") {
    return "bg";
  }
  if (channel === "text" || channel === "arrow") return "text";
  if (channel === "border" || channel === "container") return "border";
  if (channel === "outline") return "outline";
  return "ring";
};

const isLiteralToken = (token: string): boolean =>
  token === "white" ||
  token === "black" ||
  token === "transparent" ||
  token.includes("/") ||
  token.startsWith("neutral-") ||
  token.startsWith("gray-");

const formatColorToken = (palette: string, token: string): string => {
  if (isLiteralToken(token)) return token;
  if (/^\d+$/.test(token)) return `${palette}-${token}`;
  return token;
};

const emitUtility = (
  channel: Exclude<Channel, "full">,
  token: string,
  dark = false,
): string => {
  const prefix = dark ? "dark:" : "";
  const utility = channelPrefix(channel);
  return `${prefix}${utility}-${token}`;
};

const resolveOnColorFill = (
  appearance: Appearance,
  scheme: Scheme,
): string => {
  if (appearance !== "onColor") return "";
  if (scheme === "dark") return "black";
  return "white";
};

/** @deprecated Legacy generic chromatic path — retained for rollback only. */
const resolveLegacyChromaticTokens = (
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

const resolveLegacyTokens = (
  req: SemanticRequest,
  scheme: Scheme,
): ChannelTokenMap => {
  const palette = classifyPalette(req.palette);
  if (palette.paletteClass === "literal") {
    return resolveLiteralTokens(
      palette.normalized as "white" | "black" | "transparent",
      req.appearance,
      req.state,
      scheme,
    );
  }
  return resolveLegacyChromaticTokens(req, scheme);
};

const buildClassesForScheme = (
  req: SemanticRequest,
  tokens: ChannelTokenMap,
  dark: boolean,
): string[] => {
  const classes: string[] = [];
  const channels = resolveActiveChannels(req.variant, req.channel ?? "full");
  for (const channel of channels) {
    const key = channel === "indicator" || channel === "track" || channel === "thumb"
      ? "fill"
      : channel === "container"
        ? "border"
        : channel === "arrow"
          ? "text"
          : channel;
    const token = tokens[key];
    const paletteToken = formatColorToken(req.palette, token);
    classes.push(emitUtility(channel, paletteToken, dark));
  }
  return classes;
};

const composeFullInteractive = (req: SemanticRequest): string =>
  composeInteractiveSemantic(req);

const composeFullSurface = (req: SemanticRequest): string =>
  composeSurfaceSemantic(req);

const composeFromCanonicalTokens = (req: SemanticRequest): string => {
  const lightTokens = resolveCanonicalTokens(req, "light");
  const darkTokens = resolveCanonicalTokens(req, "dark");
  const light = buildClassesForScheme(req, lightTokens, false);

  if (!req.emit?.adaptive && req.emit?.scheme === "dark") {
    return buildClassesForScheme(req, darkTokens, true).join(" ");
  }
  if (req.emit?.adaptive) {
    const dark = buildClassesForScheme(req, darkTokens, true);
    return [...light, ...dark].join(" ");
  }
  return light.join(" ");
};

const composeLegacyGeneric = (req: SemanticRequest): string => {
  const lightTokens = resolveLegacyTokens(req, "light");
  const darkTokens = resolveLegacyTokens(req, "dark");
  const light = buildClassesForScheme(req, lightTokens, false);

  if (!req.emit?.adaptive && req.emit?.scheme === "dark") {
    return buildClassesForScheme(req, darkTokens, true).join(" ");
  }
  if (req.emit?.adaptive) {
    const dark = buildClassesForScheme(req, darkTokens, true);
    return [...light, ...dark].join(" ");
  }
  return light.join(" ");
};

const composeUnified = (req: SemanticRequest): string => {
  const channel = req.channel ?? "full";

  if (req.pattern === "interactive" && channel === "full") {
    return composeFullInteractive(req);
  }

  if (req.pattern === "surface" && channel === "full") {
    return composeFullSurface(req);
  }

  return composeFromCanonicalTokens(req);
};

export const composeSemantic = (request: SemanticRequest): string => {
  const req: SemanticRequest = {
    ...request,
    channel: request.channel ?? "full",
    palette: request.palette,
    emit: {
      ...DEFAULT_EMIT,
      ...(request.emit ?? {}),
    },
  };

  validatePatternStateChannel(req.pattern, req.state, req.channel ?? "full");

  if (dispatchMode === "legacy-generic-only") {
    if (req.pattern === "interactive" && (req.channel ?? "full") === "full") {
      return composeFullInteractive(req);
    }
    if (req.pattern === "surface" && (req.channel ?? "full") === "full") {
      return composeFullSurface(req);
    }
    return composeLegacyGeneric(req);
  }

  return composeUnified(req);
};
