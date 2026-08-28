import { compose, prefixInteractiveClasses } from "./index";
import {
  normalizeAppearance,
  normalizePalette,
  normalizeVariant,
  type SemanticRequest,
} from "../core/dimensions";

export type ControlVariant = "solid" | "solid-outline" | "outline";
export type ControlAppearance = "strong" | "soft" | "dualTone" | "onColor";

const indicatorReq = (
  paletteName: string,
  variant: ControlVariant,
  appearance: ControlAppearance,
  adaptive?: boolean,
): Omit<SemanticRequest, "state"> => ({
  pattern: "interactive",
  variant: normalizeVariant(variant),
  appearance: normalizeAppearance(appearance),
  palette: normalizePalette(paletteName),
  channel: "full",
  emit: { adaptive: adaptive ?? true },
});

const surfaceReq = (
  paletteName: string,
  variant: ControlVariant,
  appearance: ControlAppearance,
  adaptive?: boolean,
): Omit<SemanticRequest, "state"> => ({
  pattern: "surface",
  variant: normalizeVariant(variant),
  appearance: normalizeAppearance(appearance),
  palette: normalizePalette(paletteName),
  channel: "full",
  emit: { adaptive: adaptive ?? true },
});

/** Selected / indeterminate indicator — static resting tokens (no hover stack). */
export const composeControlSelected = (
  paletteName: string,
  variant: ControlVariant,
  appearance: ControlAppearance,
  adaptive?: boolean,
): string =>
  compose({ ...indicatorReq(paletteName, variant, appearance, adaptive), state: "default" });

/** Unselected indicator — resting + hover affordance. */
export const composeControlUnselected = (
  paletteName: string,
  variant: ControlVariant,
  appearance: ControlAppearance,
  adaptive?: boolean,
): string => {
  const req = indicatorReq(paletteName, variant, appearance, adaptive);
  const base = compose({ ...req, state: "default" });
  const hover = prefixInteractiveClasses(
    compose({ ...req, state: "hover" }),
    "hover:",
    "dark:hover:",
  );
  return `${base} ${hover}`.trim();
};

const pickTextUtilities = (classes: string): string =>
  classes
    .split(/\s+/)
    .filter((token) => token.startsWith("text-") || token.startsWith("dark:text-"))
    .join(" ");

/** Checkmark / minus / radio-dot color. */
export const composeControlIcon = (
  paletteName: string,
  variant: ControlVariant,
  appearance: ControlAppearance,
  adaptive?: boolean,
): string => {
  const full = compose({
    ...indicatorReq(paletteName, variant, appearance, adaptive),
    state: "default",
    channel: "full",
  });
  return pickTextUtilities(full);
};

/** Card container — static surface (selected resting state is non-interactive). */
export const composeControlCard = (
  paletteName: string,
  variant: ControlVariant,
  appearance: ControlAppearance,
  adaptive?: boolean,
): string =>
  compose({ ...surfaceReq(paletteName, variant, appearance, adaptive), state: "default" });

/** Radio-dot fill derived from icon/text tokens. */
export const composeControlDot = (
  paletteName: string,
  variant: ControlVariant,
  appearance: ControlAppearance,
  adaptive?: boolean,
): string =>
  composeControlIcon(paletteName, variant, appearance, adaptive)
    .split(/\s+/)
    .filter(Boolean)
    .map((token) =>
      token.startsWith("dark:text-")
        ? `dark:bg-${token.slice("dark:text-".length)}`
        : token.startsWith("text-")
          ? `bg-${token.slice("text-".length)}`
          : token,
    )
    .join(" ");

/** Card hover overlay from interactive hover slice. */
export const composeControlCardHover = (
  paletteName: string,
  variant: ControlVariant,
  appearance: ControlAppearance,
  adaptive?: boolean,
): string =>
  prefixInteractiveClasses(
    compose({ ...indicatorReq(paletteName, variant, appearance, adaptive), state: "hover" }),
    "hover:",
    "dark:hover:",
  );
