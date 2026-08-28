import React from "react";
import { registerSlot } from "../slot-registry";
import { createEagerComponent } from "../async-slot";
import { tryRenderBoundAsset } from "../bound-asset-registry";
import {
  getLogoPlaceholderProps,
  resolvePlaceholderValuesInObject,
} from "../../../core/config-loader";
import { resolveLogoSlot } from "../resolve-logo-slot";
import type { LogoProps } from "@inventive-ui/logos";

export type LogoSlot = {
  type: "logo";
} & LogoProps;

declare module "../slot-types" {
  interface SlotMap {
    logo: LogoSlot;
  }
}

const Comp = createEagerComponent<Record<string, unknown>>(
  "@inventive-ui/logos",
  (mod) => mod.Logo as React.ComponentType<Record<string, unknown>>,
);

registerSlot("logo", (slot) => {
  const withAlias = resolveLogoSlot(slot);
  const resolved = resolvePlaceholderValuesInObject(
    withAlias,
    getLogoPlaceholderProps(),
  );
  const bound = tryRenderBoundAsset(
    "logo",
    resolved as unknown as Record<string, unknown>,
  );
  if (bound !== undefined) {
    return bound;
  }
  const { type: _type, ...rest } = resolved;
  return <Comp {...rest} />;
});
