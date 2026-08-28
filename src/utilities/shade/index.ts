import { semanticApi } from "./api";
import {
  shadeShims,
  fieldAddonDivider,
  type InteractiveFullConfig,
  type InteractiveStateConfig,
  type SelectionConfig,
  type SurfaceConfig,
  type FieldConfig,
  type StatusConfig,
  type ScrollConfig,
  type SwatchConfig,
} from "./api/shims";
import { shadeRegistry, type ShadeRegistryEntry } from "./registry";
import type { SemanticRequest } from "./core/dimensions";
import type { Appearance } from "./core/dimensions";

export type {
  SemanticRequest,
  InteractiveFullConfig,
  InteractiveStateConfig,
  SelectionConfig,
  SurfaceConfig,
  FieldConfig,
  StatusConfig,
  ScrollConfig,
  SwatchConfig,
  ShadeRegistryEntry,
};

export type ComponentStyleVariant =
  | "solid"
  | "solid-outline"
  | "outline"
  | "ghost"
  | "underline"
  | "solid-underline";
export type ComponentAppearance = Appearance;
export type CanonicalVariant = ComponentStyleVariant;
export type CanonicalAppearance = ComponentAppearance;
export type InteractionState = "base" | "hover" | "active";
export type ShadeState = InteractionState;
export type InteractionVariantType = "none" | "outline" | "solid-outline" | "solid" | "ghost" | string;
export type SelectionRole = NonNullable<SelectionConfig["role"]>;
export type FieldRole = NonNullable<FieldConfig["role"]>;
export type StatusRole = NonNullable<StatusConfig["role"]>;
export type ScrollPartRole = NonNullable<ScrollConfig["role"]>;
export type SwatchRole = NonNullable<SwatchConfig["role"]>;
export type ControlStyleVariant = "outline" | "solid" | "solid-outline";
export type ControlAppearance = ComponentAppearance;
export type ControlIndicatorKind = "checkbox" | "radio";
export type ControlCardKind = "checkbox" | "radio";
export type ControlCardState = "selected" | "unselected" | "indeterminate";
export type ControlCardVariant = ControlStyleVariant;
export type ControlCardAppearance = ControlAppearance;
export type ControlIconPart = "text" | "bg";
export type UIState =
  | "default"
  | "hover"
  | "pressed"
  | "selected"
  | "disabled"
  | "focus"
  | "error";
export type ComposedShadeConfig = InteractiveFullConfig;

export { shadeRegistry, fieldAddonDivider };

export const shade = {
  compose: semanticApi.compose,
  stack: semanticApi.stack,
  slice: semanticApi.slice,
  channel: semanticApi.channel,
  ...shadeShims,
};

export type Shade = typeof shade;
