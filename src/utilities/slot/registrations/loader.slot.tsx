import React from "react";
import { registerSlot } from "../slot-registry";
import { createEagerComponent } from "../async-slot";
import { tryRenderBoundAsset } from "../bound-asset-registry";
import { normalizeLoaderName } from "../normalize-loader-name";
import {
  getGlobalLoaders,
  getLoaderDefaults,
  getLoaderFallback,
  getLoaderPlaceholderProps,
} from "../../../core/config-loader";
import { resolveAssetAliasValue } from "../resolve-asset-alias-value";
import type { LoaderProps } from "@inventive-ui/loaders";

export type LoaderSlot = {
  type: "loader";
} & LoaderProps;

declare module "../slot-types" {
  interface SlotMap {
    loader: LoaderSlot;
  }
}

const LoaderComp = createEagerComponent<Record<string, unknown>>(
  "@inventive-ui/loaders",
  (mod) => mod.Loader as React.ComponentType<Record<string, unknown>>,
);

function resolveLoaderSlot(slot: LoaderSlot): LoaderSlot {
  const defaults = getLoaderDefaults();
  const merged = {
    ...defaults,
    ...slot,
  } as LoaderSlot;

  const name = merged.name;
  if (typeof name !== "string" || name.length === 0) {
    return merged;
  }

  const resolvedName = name.startsWith("@")
    ? resolveAssetAliasValue({
        rawValue: name,
        globalMap: getGlobalLoaders(),
        placeholderProps: getLoaderPlaceholderProps(),
        placeholderField: "name",
        fallback: getLoaderFallback(),
        assetLabel: "loader",
      })
    : name;

  return {
    ...merged,
    name: normalizeLoaderName(resolvedName) as LoaderSlot["name"],
  };
}

registerSlot("loader", (slot) => {
  const resolved = resolveLoaderSlot(slot);
  const bound = tryRenderBoundAsset(
    "loader",
    resolved as unknown as Record<string, unknown>,
  );
  if (bound !== undefined) {
    return bound;
  }
  const { type: _type, ...rest } = resolved;
  return <LoaderComp {...rest} />;
});
