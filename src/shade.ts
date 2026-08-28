/**
 * Browser-safe semantic shade entry.
 *
 * Build-time scanners intentionally live outside this entry and are not part of
 * the public runtime API.
 */
export {
  compose,
  stack,
  slice,
  channel,
  prefixInteractiveClasses,
} from "./utilities/shade/api";
export { shade } from "./utilities/shade";

export type {
  SemanticRequest,
  ComponentStyleVariant,
  ComponentAppearance,
  CanonicalVariant,
  CanonicalAppearance,
  InteractionState,
  ShadeState,
  InteractionVariantType,
  UIState,
  ComposedShadeConfig,
  InteractiveFullConfig,
  InteractiveStateConfig,
  SelectionConfig,
  SurfaceConfig,
  FieldConfig,
  StatusConfig,
  ScrollConfig,
  SwatchConfig,
  SelectionRole,
  FieldRole,
  StatusRole,
  ScrollPartRole,
  SwatchRole,
  Shade,
} from "./utilities/shade";
export type {
  Pattern,
  Variant,
  Appearance,
  State,
  Channel,
  PaletteClass,
  Scheme,
  EmitConfig,
} from "./utilities/shade/core/dimensions";
