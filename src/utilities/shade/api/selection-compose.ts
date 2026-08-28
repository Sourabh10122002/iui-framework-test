import { compose, prefixInteractiveClasses } from "./index";
import {
  normalizeAppearance,
  normalizePalette,
  normalizeVariant,
  type State,
} from "../core/dimensions";

export type SelectionVariant = "solid" | "solid-outline" | "outline" | "ghost";
export type SelectionAppearance = "strong" | "soft" | "dualTone" | "onColor";

const selectionReq = (
  paletteName: string,
  variant: SelectionVariant,
  appearance: SelectionAppearance,
  adaptive?: boolean,
) => ({
  pattern: "interactive" as const,
  variant: normalizeVariant(variant),
  appearance: normalizeAppearance(appearance),
  palette: normalizePalette(paletteName),
  channel: "full" as const,
  emit: { adaptive: adaptive ?? true },
});

export const composeSelectionRow = (
  paletteName: string,
  variant: SelectionVariant,
  appearance: SelectionAppearance,
  state: "default" | "hover",
  adaptive?: boolean,
): string =>
  compose({
    ...selectionReq(paletteName, variant, appearance, adaptive),
    state: (state === "hover" ? "hover" : "default") as State,
  });

export const pickTextUtilities = (classes: string): string =>
  classes
    .split(/\s+/)
    .filter((token) => token.startsWith("text-") || token.startsWith("dark:text-"))
    .join(" ");

export const pickFillUtilities = (classes: string): string =>
  classes
    .split(/\s+/)
    .filter((token) => token.startsWith("bg-") || token.startsWith("dark:bg-"))
    .join(" ");

/** Pagination / menu row — selected label color on transparent row. */
export const composeSelectionLabel = (
  paletteName: string,
  appearance: SelectionAppearance = "soft",
  adaptive?: boolean,
): string =>
  pickTextUtilities(
    composeSelectionRow(paletteName, "solid", appearance, "default", adaptive),
  );

/** Pagination / menu row — keyboard/mouse highlight background. */
export const composeSelectionHighlight = (
  paletteName: string = "neutral",
  adaptive?: boolean,
): string =>
  pickFillUtilities(
    composeSelectionRow(paletteName, "ghost", "soft", "hover", adaptive),
  );

/** Avatar / chip hover-focus-active affordance. */
export const composeSelectionInteractive = (
  paletteName: string,
  variant: SelectionVariant,
  appearance: SelectionAppearance,
  adaptive?: boolean,
): string => {
  const req = selectionReq(paletteName, variant, appearance, adaptive);
  const hover = prefixInteractiveClasses(
    compose({ ...req, state: "hover" }),
    "hover:",
    "dark:hover:",
  );
  const focus = prefixInteractiveClasses(
    compose({ ...req, state: "hover" }),
    "focus:",
    "dark:focus:",
  );
  const active = prefixInteractiveClasses(
    compose({ ...req, state: "pressed" }),
    "active:",
    "dark:active:",
  );
  return `${hover} ${focus} ${active}`.trim();
};
