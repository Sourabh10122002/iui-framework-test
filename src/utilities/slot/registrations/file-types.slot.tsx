import { registerSlot } from "../slot-registry";
import { getFileTypeLibraryRenderer } from "../fileTypeLibrary-registry";
import { resolveFileTypeSlot } from "../resolve-file-type-slot";
import { tryRenderBoundAsset } from "../bound-asset-registry";
import type { FileTypeSlot, ResolvedFileTypeSlot } from "../slot-types";
import { logger } from "../../logger";

export type { FileTypeSlot } from "../slot-types";

declare module "../slot-types" {
  interface SlotMap {
    "file-type": FileTypeSlot;
  }
}

registerSlot("file-type", (slot) => {
  const resolved = resolveFileTypeSlot(slot) as ResolvedFileTypeSlot;

  const bound = tryRenderBoundAsset(
    "file-type",
    resolved as unknown as Record<string, unknown>,
  );
  if (bound !== undefined) {
    return bound;
  }

  const renderer = getFileTypeLibraryRenderer(resolved.library);

  if (!renderer) {
    logger.warn(
      `[FileTypeSlot] No renderer registered for "${String(resolved.library)}"`,
    );
    return null;
  }

  return renderer(resolved);
});
