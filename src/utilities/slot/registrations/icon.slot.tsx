import React from "react";
import { registerSlot } from "../slot-registry";
import { getIconLibraryRenderer } from "../iconLibrary-registry";
import { resolveIconSlot } from "../resolve-icon-slot";
import { tryRenderBoundAsset } from "../bound-asset-registry";
import type { IconSlot, ResolvedIconSlot } from "../slot-types";
import { createScopedLogger } from "../../logger";

const iconLogger = createScopedLogger("IconSlot");

function normalizeIconSlot(resolved: ResolvedIconSlot): ResolvedIconSlot {
  const mergedClassName = [
    resolved.className,
    "text-current",
    "fill-current",
    "stroke-current",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    ...resolved,
    color: resolved.color ?? "currentColor",
    className: mergedClassName,
  };
}

registerSlot("icon", (slot: IconSlot) => {
  const resolved = resolveIconSlot(slot) as ResolvedIconSlot;
  const normalizedSlot = normalizeIconSlot(resolved);
  const slotRecord = normalizedSlot as unknown as Record<string, unknown>;

  // 1. Try bound asset first (pre-compiled, fastest)
  const bound = tryRenderBoundAsset("icon", slotRecord);
  if (bound !== undefined) {
    return bound;
  }

  // 2. Fall through to lazy library renderer (same pattern as logos/color-logos)
  const renderer = getIconLibraryRenderer(resolved.library);
  if (!renderer) {
    iconLogger.warn(
      `No renderer registered for "${String(resolved.library)}"`,
    );
    return null;
  }

  return renderer(normalizedSlot);
});
