const { existsSync } = require("fs");
const { dirname, join, parse, resolve } = require("path");

function findInventiveUiNodeModulesRoot(startDir) {
  let dir = resolve(startDir);
  const fsRoot = parse(dir).root;
  let best = null;

  while (true) {
    if (existsSync(join(dir, "node_modules", "@inventive-ui"))) {
      best = dir;
    }
    if (dir === fsRoot) break;
    dir = dirname(dir);
  }

  return best ?? resolve(startDir);
}

const ASSET_SUBPATH_PACKAGES = [
  { pkg: "icons-lucide", dir: "icons", reserved: new Set(["react", "vanilla", "utils"]) },
  { pkg: "icons-phosphor", dir: "icons", reserved: new Set(["react", "vanilla", "utils"]) },
  { pkg: "icons-material", dir: "icons", reserved: new Set(["react", "vanilla", "utils"]) },
  { pkg: "material-symbols", dir: "icons", reserved: new Set(["react", "vanilla", "utils"]) },
  { pkg: "logos", dir: "logos", reserved: new Set(["react", "vanilla", "utils"]) },
  { pkg: "color-logos", dir: "logos", reserved: new Set(["react", "vanilla", "utils"]) },
  { pkg: "flags", dir: "flags", reserved: new Set(["react", "vanilla", "utils"]) },
  { pkg: "file-types", dir: "types", reserved: new Set(["react", "vanilla", "utils"]) },
];

function pkgDist(projectRoot, pkg, ...parts) {
  return join(projectRoot, "node_modules", "@inventive-ui", pkg, "dist", ...parts);
}

function existingPkgFile(projectRoot, pkg, ...parts) {
  const file = pkgDist(projectRoot, pkg, ...parts);
  return existsSync(file) ? file : null;
}

function resolveAssetSubpath(projectRoot, source) {
  for (const { pkg, dir, reserved } of ASSET_SUBPATH_PACKAGES) {
    const prefix = `@inventive-ui/${pkg}/`;
    if (!source.startsWith(prefix)) continue;
    const sub = source.slice(prefix.length);
    if (!sub || sub.includes("/")) continue;
    if (sub === "react") return existingPkgFile(projectRoot, pkg, "react.js");
    if (sub === "vanilla") return existingPkgFile(projectRoot, pkg, "vanilla.js");
    if (sub === "utils") return existingPkgFile(projectRoot, pkg, "index.js");
    if (reserved.has(sub)) continue;
    return existingPkgFile(projectRoot, pkg, dir, `${sub}.js`);
  }

  const loaderSubpath = source.match(/^@inventive-ui\/loaders\/([^/]+)$/);
  if (loaderSubpath && loaderSubpath[1] !== "react") {
    return existingPkgFile(projectRoot, "loaders", "loaders", `${loaderSubpath[1]}.js`);
  }

  const familyScene = source.match(
    /^@inventive-ui\/illustrations\/(amico|bro|cuate|pana|rafiki)\/([^/]+)$/,
  );
  if (familyScene) {
    return existingPkgFile(
      projectRoot,
      "illustrations",
      familyScene[1],
      `${familyScene[2]}.js`,
    );
  }

  if (source === "@inventive-ui/illustrations/illustrations.json") {
    return existingPkgFile(projectRoot, "illustrations", "illustrations.json");
  }

  if (source === "@inventive-ui/color-logos/dist/color-logos.json") {
    return existingPkgFile(projectRoot, "color-logos", "color-logos.json");
  }

  return null;
}

module.exports = {
  findInventiveUiNodeModulesRoot,
  resolveAssetSubpath,
};
