import React from "react";
import { registerSlot } from "../slot-registry";
import { createEagerComponent } from "../async-slot";
import { tryRenderBoundAsset } from "../bound-asset-registry";
import {
  getColorLogoPlaceholderProps,
  resolvePlaceholderValuesInObject,
} from "../../../core/config-loader";
import { resolveColorLogoSlot } from "../resolve-color-logo-slot";
import type { ColorLogoProps } from "@inventive-ui/color-logos";

export type ColorLogoSlot = {
  type: "color-logo";
} & ColorLogoProps;

declare module "../slot-types" {
  interface SlotMap {
    "color-logo": ColorLogoSlot;
  }
}

const Comp = createEagerComponent<Record<string, unknown>>(
  "@inventive-ui/color-logos",
  (mod) => mod.ColorLogo as React.ComponentType<Record<string, unknown>>,
);

registerSlot("color-logo", (slot) => {
  const withAlias = resolveColorLogoSlot(slot);
  const resolved = resolvePlaceholderValuesInObject(
    withAlias,
    getColorLogoPlaceholderProps(),
  );
  const bound = tryRenderBoundAsset(
    "color-logo",
    resolved as unknown as Record<string, unknown>,
  );
  if (bound !== undefined) {
    return bound;
  }
  const { type: _type, ...rest } = resolved;
  return <Comp {...rest} />;
});
