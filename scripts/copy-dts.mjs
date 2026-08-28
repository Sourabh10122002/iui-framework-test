import fs from "fs";
import path from "path";

const root = path.resolve(".");
const dist = path.join(root, "dist");

const pairs = [
  // Main entry: rollup-plugin-typescript2 may emit `dist/index.d.ts` (flat) or
  // `dist/src/index.d.ts` (mirrors src/). Only copy when a nested file must land at root.
  {
    from: path.join(dist, "src", "index.d.ts"),
    to: path.join(dist, "index.d.ts"),
  },
  {
    from: path.join(dist, "src", "slots.d.ts"),
    to: path.join(dist, "slots.d.ts"),
  },
  {
    from: path.join(dist, "src", "shade.d.ts"),
    to: path.join(dist, "shade.d.ts"),
  },
  {
    // The build emits core d.ts under dist/core (published package shape).
    // Keep dist/config.d.ts in sync with package.json exports "./config".
    from: path.join(dist, "core", "config.d.ts"),
    to: path.join(dist, "config.d.ts"),
  },
];

for (const { from, to } of pairs) {
  if (!fs.existsSync(from)) {
    // Flat emit: types already at `to` — nothing to do (avoid noisy warnings).
    if (fs.existsSync(to)) {
      continue;
    }
    console.warn(`[copy-dts] Missing source: ${from}`);
    continue;
  }
  if (path.resolve(from) === path.resolve(to)) {
    continue;
  }
  // Rollup + rollup-plugin-typescript2 emit a complete flat `dist/index.d.ts` (includes `export *` from
  // token barrels). A mirrored `dist/src/index.d.ts` is often a narrower program emit — copying it
  // would overwrite and drop public re-exports. Never clobber an existing root index.
  if (path.basename(to) === "index.d.ts" && fs.existsSync(to)) {
    console.log(`[copy-dts] keep existing ${path.relative(root, to)} (do not overwrite with nested emit)`);
    continue;
  }
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
  console.log(`[copy-dts] ${path.relative(root, from)} -> ${path.relative(root, to)}`);
}

/** Drop declaration stubs for test files — they must not ship in the npm tarball. */
function removeTestDeclarations(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      removeTestDeclarations(full);
      continue;
    }
    if (/\.test\.d\.ts$/.test(entry.name) || /\.spec\.d\.ts$/.test(entry.name)) {
      fs.unlinkSync(full);
      console.log(`[copy-dts] removed ${path.relative(root, full)}`);
    }
  }
}

removeTestDeclarations(dist);
