/**
 * Machine-readable shade registry — used by shade-map-gen and Shade Studio.
 * Every row points at semantic engine entrypoints.
 */
export const shadeRegistry = [
  {
    component: "Interactive full stack",
    domain: "semantic",
    method: "stack",
    edit: "api/index.ts → stack(req)",
  },
  {
    component: "Single semantic slice",
    domain: "semantic",
    method: "slice",
    edit: "api/index.ts → slice(req)",
  },
  {
    component: "Channel-focused semantic output",
    domain: "semantic",
    method: "channel",
    edit: "api/index.ts → channel(req)",
  },
  {
    component: "Composer topology + emit",
    domain: "semantic",
    method: "compose",
    edit: "core/composer.ts",
  },
  {
    component: "Pattern/state/channel constraints",
    domain: "semantic",
    method: "validation",
    edit: "core/patterns.ts",
  },
  {
    component: "Appearance profile ownership",
    domain: "semantic",
    method: "appearance",
    edit: "core/appearance-profile.ts",
  },
  {
    component: "State progression mapping",
    domain: "semantic",
    method: "progression",
    edit: "core/state-progression.ts",
  },
  {
    component: "Variant channel topology",
    domain: "semantic",
    method: "topology",
    edit: "core/variant-topology.ts",
  },
  {
    component: "Literal palette transforms",
    domain: "semantic",
    method: "literal",
    edit: "core/literal-transform.ts",
  },
  {
    component: "Compatibility shims",
    domain: "semantic",
    method: "shim",
    edit: "api/shims.ts",
  },
] as const;

export type ShadeRegistryEntry = (typeof shadeRegistry)[number];
