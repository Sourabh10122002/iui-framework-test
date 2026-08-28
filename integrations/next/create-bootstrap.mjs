import fs from "fs";
import path from "path";
import {
  buildBootstrapBridgeShimSource,
  buildLegacyBootstrapShimSource,
  isPublicIuiCssReady,
  resolveBootstrapBridge,
} from "../shared/bootstrap-bridge.mjs";

export { resolveBootstrapBridge, isPublicIuiCssReady };

/**
 * Writes `.iui-bootstrap-{server|client}.js` — webpack alias target for `iui-bootstrap`.
 * @param {string} root
 * @param {{ isServer: boolean }} options
 */
export function writeNextBootstrapShim(root, { isServer }) {
  const file = path.join(
    root,
    `.iui-bootstrap-${isServer ? "server" : "client"}.js`,
  );
  const publicCssReady = isServer && isPublicIuiCssReady(root);

  const code = resolveBootstrapBridge(root)
    ? buildBootstrapBridgeShimSource(root, {
        includeManifest: true,
        includeBuildHref: true,
        includeInlineCss: true,
        isServer,
        publicCssReady,
      })
    : buildLegacyBootstrapShimSource(root);

  fs.writeFileSync(file, code.trim() + "\n", "utf8");
  return file;
}
