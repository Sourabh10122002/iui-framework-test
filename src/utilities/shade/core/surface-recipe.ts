import type { Appearance, SemanticRequest, Variant } from "./dimensions";
import { classifyPalette, type PaletteClassification } from "./palette-classify";
import {
  resolveInteractiveTokens,
  shouldEmitInteractiveDark,
} from "./interactive-recipe";

type ResolvedTokens = {
  fill: string;
  text: string;
  outline?: string;
  border?: string;
  ring?: string;
};

const withPrefix = (prefix: string, token: string): string =>
  token
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => `${prefix}${part}`)
    .join(" ");

export const buildSurfaceClasses = (
  variant: Variant,
  tokens: ResolvedTokens,
  dark: boolean,
  options: { paletteClass?: PaletteClassification["paletteClass"]; appearance?: Appearance } = {},
): string => {
  const prefix = dark ? "dark:" : "";
  const parts: string[] = [];
  const borderColor = tokens.border ?? tokens.outline ?? tokens.fill;

  switch (variant) {
    case "solid":
      parts.push(
        withPrefix(prefix, `bg-${tokens.fill}`),
        withPrefix(prefix, `text-${tokens.text}`),
      );
      break;
    case "solidOutline":
      parts.push(
        withPrefix(prefix, `bg-${tokens.fill}`),
        withPrefix(prefix, `text-${tokens.text}`),
        withPrefix(prefix, "border border-1"),
        withPrefix(prefix, `border-${borderColor}`),
      );
      break;
    case "outline":
      parts.push(
        withPrefix(prefix, "bg-transparent"),
        withPrefix(prefix, `text-${tokens.text}`),
        withPrefix(prefix, "border border-1"),
        withPrefix(prefix, `border-${borderColor}`),
      );
      break;
    case "ghost":
      parts.push(
        withPrefix(prefix, "bg-transparent"),
        withPrefix(prefix, `text-${tokens.text}`),
        withPrefix(prefix, "border-transparent"),
      );
      break;
    case "underline":
      parts.push(
        withPrefix(prefix, `text-${tokens.text}`),
        withPrefix(prefix, `border-${borderColor}`),
        withPrefix(prefix, `ring-${tokens.ring ?? borderColor}`),
      );
      break;
    case "solidUnderline":
      parts.push(
        withPrefix(prefix, `bg-${tokens.fill}`),
        withPrefix(prefix, `text-${tokens.text}`),
        withPrefix(prefix, `border-${borderColor}`),
        withPrefix(prefix, `ring-${tokens.ring ?? borderColor}`),
      );
      break;
    default:
      parts.push(
        withPrefix(prefix, `bg-${tokens.fill}`),
        withPrefix(prefix, `text-${tokens.text}`),
      );
      break;
  }

  return parts.join(" ");
};

export const composeSurfaceSemantic = (req: SemanticRequest): string => {
  const surfaceReq: SemanticRequest = { ...req, state: "default" };
  const paletteInfo = classifyPalette(surfaceReq.palette);
  const classOptions = {
    paletteClass: paletteInfo.paletteClass,
    appearance: surfaceReq.appearance,
  };
  const lightTokens = resolveInteractiveTokens(surfaceReq, paletteInfo, "light");
  const light = buildSurfaceClasses(
    surfaceReq.variant,
    lightTokens,
    false,
    classOptions,
  );

  const emitDark =
    surfaceReq.emit?.adaptive !== false &&
    (paletteInfo.normalized === "transparent" ||
      shouldEmitInteractiveDark(surfaceReq.variant, surfaceReq.appearance));

  if (!emitDark && surfaceReq.emit?.scheme !== "dark") {
    return light;
  }

  if (surfaceReq.emit?.scheme === "dark" && surfaceReq.emit?.adaptive === false) {
    const darkTokens = resolveInteractiveTokens(surfaceReq, paletteInfo, "dark");
    return buildSurfaceClasses(surfaceReq.variant, darkTokens, true, classOptions);
  }

  if (!emitDark) {
    return light;
  }

  const darkTokens = resolveInteractiveTokens(surfaceReq, paletteInfo, "dark");
  const dark = buildSurfaceClasses(surfaceReq.variant, darkTokens, true, classOptions);
  return [light, dark].join(" ");
};
