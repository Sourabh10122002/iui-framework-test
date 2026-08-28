/**
 * CJS build of slot-transform — used by Webpack loader (sync require).
 * ESM consumers import via slot-transform.mjs re-export.
 */

const SLOT_HOOK_PACKAGES = [
  {
    pkg: "icons-lucide",
    npm: "@inventive-ui/icons-lucide",
    var: "__iuiSlotIconsLucide",
    patterns: [
      /import\(`\.\/icons\/\$\{([^}]+)\}\.js`\)/g,
      /import\(`@inventive-ui\/icons-lucide\/\$\{([^}]+)\}`\)/g,
    ],
    key: (nameVar) => `\`./icons/\${${nameVar}}.js\``,
  },
  {
    pkg: "icons-phosphor",
    npm: "@inventive-ui/icons-phosphor",
    var: "__iuiSlotIconsPhosphor",
    patterns: [
      /import\(`\.\/icons\/\$\{([^}]+)\}\.js`\)/g,
      /import\(`@inventive-ui\/icons-phosphor\/\$\{([^}]+)\}`\)/g,
    ],
    key: (nameVar) => `\`./icons/\${${nameVar}}.js\``,
  },
  {
    pkg: "icons-material",
    npm: "@inventive-ui/icons-material",
    var: "__iuiSlotIconsMaterial",
    patterns: [
      /import\(`\.\/icons\/\$\{([^}]+)\}\.js`\)/g,
      /import\(`@inventive-ui\/icons-material\/\$\{([^}]+)\}`\)/g,
    ],
    key: (nameVar) => `\`./icons/\${${nameVar}}.js\``,
  },
  {
    pkg: "material-symbols",
    npm: "@inventive-ui/material-symbols",
    var: "__iuiSlotMaterialSymbols",
    patterns: [
      /import\(`\.\/icons\/\$\{([^}]+)\}\.js`\)/g,
      /import\(`@inventive-ui\/material-symbols\/\$\{([^}]+)\}`\)/g,
    ],
    key: (nameVar) => `\`./icons/\${${nameVar}}.js\``,
  },
  {
    pkg: "logos",
    npm: "@inventive-ui/logos",
    var: "__iuiSlotLogos",
    patterns: [
      /import\(`\.\/logos\/\$\{([^}]+)\}\.js`\)/g,
      /import\(`@inventive-ui\/logos\/\$\{([^}]+)\}`\)/g,
    ],
    key: (nameVar) => `\`./logos/\${${nameVar}}.js\``,
  },
  {
    pkg: "color-logos",
    npm: "@inventive-ui/color-logos",
    var: "__iuiSlotColorLogos",
    patterns: [
      /import\(`\.\/logos\/\$\{([^}]+)\}\.js`\)/g,
      /import\(`@inventive-ui\/color-logos\/\$\{([^}]+)\}`\)/g,
    ],
    key: (nameVar) => `\`./logos/\${${nameVar}}.js\``,
  },
  {
    pkg: "flags",
    npm: "@inventive-ui/flags",
    var: "__iuiSlotFlags",
    patterns: [
      /import\(`\.\/flags\/\$\{([^}]+)\}\.js`\)/g,
      /import\(`@inventive-ui\/flags\/\$\{([^}]+)\}`\)/g,
    ],
    key: (nameVar) => `\`./flags/\${${nameVar}}.js\``,
  },
  {
    pkg: "file-types",
    npm: "@inventive-ui/file-types",
    var: "__iuiSlotFileTypes",
    patterns: [
      /import\(`\.\/types\/\$\{([^}]+)\}\.js`\)/g,
      /import\(`@inventive-ui\/file-types\/\$\{([^}]+)\}`\)/g,
    ],
    key: (nameVar) => `\`./types/\${${nameVar}}.js\``,
  },
  {
    pkg: "loaders",
    npm: "@inventive-ui/loaders",
    var: "__iuiSlotLoaders",
    patterns: [
      /import\(`\.\/loaders\/\$\{([^}]+)\}\.js`\)/g,
      /import\(`@inventive-ui\/loaders\/\$\{([^}]+)\}`\)/g,
    ],
    key: (nameVar) => `\`./loaders/\${${nameVar}}.js\``,
  },
  {
    pkg: "illustrations",
    npm: "@inventive-ui/illustrations",
    var: "__iuiSlotIllustrations",
    patterns: [
      /import\(`\.\/\$\{([^}]+)\}\/\$\{([^}]+)\}\.js`\)/g,
      /import\(`@inventive-ui\/illustrations\/\$\{([^}]+)\}\/\$\{([^}]+)\}`\)/g,
    ],
    keyExpr: (familyVar, sceneVar) => `\`./\${${familyVar}}/\${${sceneVar}}.js\``,
  },
];

const PKG_ASSET_DIR = {
  "icons-lucide": "icons",
  "icons-phosphor": "icons",
  "icons-material": "icons",
  "material-symbols": "icons",
  logos: "logos",
  "color-logos": "logos",
  flags: "flags",
  "file-types": "types",
  loaders: "loaders",
};

function packageFolderFromId(id) {
  const normalized = id.replace(/\\/g, "/");
  const match = normalized.match(/@inventive-ui\/([^/]+)\/dist\//);
  return match?.[1] ?? null;
}

function isTransformableAssetDist(id) {
  const normalized = id.replace(/\\/g, "/");
  return normalized.includes("@inventive-ui/") && normalized.includes("/dist/");
}

function loaderImportPath(npmPackage, lookupKey, pkgFolder) {
  let subpath = lookupKey.replace(/^\.\//, "").replace(/\.js$/, "");
  const assetDir = PKG_ASSET_DIR[pkgFolder];
  if (assetDir && subpath.startsWith(`${assetDir}/`)) {
    subpath = subpath.slice(assetDir.length + 1);
  }
  return `${npmPackage}/${subpath}`;
}

function buildLoaderConst(varName, npmPackage, names, pkgFolder) {
  if (!names || names.size === 0) {
    return `const ${varName} = {};`;
  }

  const entries = [...names]
    .sort()
    .map((lookupKey) => {
      const importPath = loaderImportPath(npmPackage, lookupKey, pkgFolder);
      return `  ${JSON.stringify(lookupKey)}: () => import(${JSON.stringify(importPath)})`;
    })
    .join(",\n");

  return `const ${varName} = {\n${entries}\n};`;
}

function injectLoaderConst(code, varName, loaderDecl) {
  const marker = `const ${varName} =`;
  const start = code.indexOf(marker);
  if (start !== -1) {
    const braceStart = code.indexOf("{", start);
    if (braceStart !== -1) {
      let depth = 0;
      for (let i = braceStart; i < code.length; i++) {
        if (code[i] === "{") depth++;
        if (code[i] === "}") depth--;
        if (depth === 0) {
          const end = code.indexOf(";", i);
          if (end !== -1) {
            return code.slice(0, start) + loaderDecl + code.slice(end + 1);
          }
          break;
        }
      }
    }
  }

  const importMatch = code.match(/^import[^\n]+\n/m);
  if (importMatch) {
    return code.replace(importMatch[0], `${importMatch[0]}${loaderDecl}\n`);
  }

  return `${loaderDecl}\n${code}`;
}

function buildGlobDecl(varName, pkgFolder) {
  if (pkgFolder === "illustrations") {
    return `const ${varName}Glob = import.meta.glob("./*/*.js");`;
  }
  const assetDir = PKG_ASSET_DIR[pkgFolder];
  if (!assetDir) {
    return "";
  }
  return `const ${varName}Glob = import.meta.glob("./${assetDir}/*.js");`;
}

function buildCatalogGlobFallbackBody(varName, keyExpr) {
  return `(() => { const _k = ${keyExpr}; const _l = ${varName}Glob[_k]; return _l ? _l() : Promise.reject(new Error("Asset not in build manifest")); })`;
}

/** Loader map values and fallbacks must be zero-arg thunks — the rewrite calls `(expr)()`. */
function wrapLoaderThunk(body) {
  const trimmed = String(body).trim();
  if (trimmed.startsWith("(()")) {
    return trimmed;
  }
  return `(() => ${trimmed})`;
}

function buildRuntimeDynamicFallback(config, nameVar) {
  const assetDir = PKG_ASSET_DIR[config.pkg];
  if (!assetDir) {
    return wrapLoaderThunk(`Promise.reject(new Error("Asset not in build manifest"))`);
  }
  return wrapLoaderThunk(`import(\`./${assetDir}/\${${nameVar}}.js\`)`);
}

/** Storybook / static hosts: load glyphs from copied public assets (no Rollup context). */
function buildExternalRuntimeFallback(config, nameVar, publicBase) {
  if (config.keyExpr) {
    return buildRuntimeDynamicFallback(config, nameVar);
  }
  const assetDir = PKG_ASSET_DIR[config.pkg];
  if (!assetDir) {
    return wrapLoaderThunk(`Promise.reject(new Error("Asset not in build manifest"))`);
  }
  const base = String(publicBase).replace(/\/$/, "");
  return wrapLoaderThunk(
    `import(/* @vite-ignore */ \`${base}/${config.pkg}/${assetDir}/\${${nameVar}}.js\`)`,
  );
}

function resolveAssetFallback(config, nameVar, key, options) {
  const externalBase =
    typeof options.assetRuntimeExternal === "string"
      ? options.assetRuntimeExternal.trim()
      : "";
  if (externalBase) {
    return buildExternalRuntimeFallback(config, nameVar, externalBase);
  }
  if (options.catalogGlobFallback) {
    return buildCatalogGlobFallbackBody(config.var, key);
  }
  if (config.keyExpr) {
    return wrapLoaderThunk(`import(\`./\${${nameVar}}.js\`)`);
  }
  return buildRuntimeDynamicFallback(config, nameVar);
}

function replaceDynamicImportWithLoader(code, config, names, options = {}) {
  const catalogGlobFallback =
    !options.assetRuntimeExternal && Boolean(options.catalogGlobFallback);
  let next = code;
  let changed = false;

  for (const pattern of config.patterns) {
    pattern.lastIndex = 0;
    if (!pattern.test(next)) continue;
    pattern.lastIndex = 0;

    if (config.keyExpr) {
      next = next.replace(pattern, (_match, a, b) => {
        const key = config.keyExpr(a, b);
        const fallback = catalogGlobFallback
          ? buildCatalogGlobFallbackBody(config.var, key)
          : wrapLoaderThunk(`import(\`./\${${a}}/\${${b}}.js\`)`);
        return `(${config.var}[${key}] ?? ${fallback})()`;
      });
    } else {
      next = next.replace(pattern, (_match, nameVar) => {
        const key = config.key(nameVar);
        const fallback = resolveAssetFallback(config, nameVar, key, {
          ...options,
          catalogGlobFallback,
        });
        return `(${config.var}[${key}] ?? ${fallback})()`;
      });
    }
    changed = true;
  }

  if (!changed) return null;

  const loaderDecl = buildLoaderConst(config.var, config.npm, names, config.pkg);
  const globDecl = catalogGlobFallback ? buildGlobDecl(config.var, config.pkg) : "";
  const combinedDecl = globDecl ? `${loaderDecl}\n${globDecl}` : loaderDecl;
  return injectLoaderConst(next, config.var, combinedDecl);
}

function transformAssetDistModule(code, pkgFolder, registry, options = {}) {
  const config = SLOT_HOOK_PACKAGES.find((entry) => entry.pkg === pkgFolder);
  if (!config) return null;

  const hasPattern = config.patterns.some((pattern) => {
    pattern.lastIndex = 0;
    return pattern.test(code);
  });
  if (!hasPattern) return null;

  const names = registry.get(pkgFolder) ?? new Set();
  return replaceDynamicImportWithLoader(code, config, names, options);
}

module.exports = {
  SLOT_HOOK_PACKAGES,
  packageFolderFromId,
  isTransformableAssetDist,
  transformAssetDistModule,
};
