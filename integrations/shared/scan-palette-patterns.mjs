import { parse } from "@babel/parser";
import _traverse from "@babel/traverse";

const traverse = _traverse.default ?? _traverse;

const COLOR_PROPERTIES = new Set(["bg", "text", "border", "outline", "ring", "fill", "stroke"]);
const PALETTE_VAR_NAMES = new Set([
  "palette",
  "paletteName",
  "color",
  "colorName",
  "cssColorName",
  "interactionColor",
  "themeStateColor",
  "neutral",
]);
const SHADE_VAR_NAMES = new Set(["shade", "step", "shadeStep", "colorShade"]);

/** @typedef {{ variantPrefix: string, property: string, paletteVar: string, shade: string | null, dynamicShade: boolean, shadeVar?: string }} PalettePattern */

/** @typedef {{ paletteDefaults: Map<string, string>, paletteUnions: Map<string, Set<string>>, paletteMapKeys: Set<string>, dynamicPaletteVars: Set<string>, patterns: PalettePattern[] }} FilePaletteSignals */

/**
 * @param {string} content
 */
function scanPalettePatternsRegex(content) {
  /** @type {PalettePattern[]} */
  const patterns = [];

  /**
   * Split `dark:hover:text` → variantPrefix `dark:hover`, property already in group 2.
   * When there is no variant (`bg` / `text`), prefix must be "" — never slice(0,-1)
   * which produced polluted tokens like `b:bg-…` / `tex:text-…` / `outlin:outline-…`.
   * @param {string} propertyWithVariants
   * @param {string} property
   */
  function variantPrefixFromMatch(propertyWithVariants, property) {
    if (!propertyWithVariants || propertyWithVariants === property) return "";
    if (!propertyWithVariants.endsWith(property)) return "";
    const withoutProp = propertyWithVariants.slice(
      0,
      propertyWithVariants.length - property.length,
    );
    return withoutProp.endsWith(":")
      ? withoutProp.slice(0, -1)
      : withoutProp;
  }

  // Shade templates: exact `` `border-${palette}-50` `` or compound
  // `` `border-${palette}-50 ${…}` `` (capture ends at shade digits).
  const templateRe =
    /((?:(?:hover:|active:|focus:|dark:|disabled:)*)(bg|text|border|outline|ring|fill|stroke))-\$\{([a-zA-Z_$][\w$]*)\}-(\d{2,3})(?=[\s`$])/g;

  let match;
  while ((match = templateRe.exec(content)) !== null) {
    patterns.push({
      variantPrefix: variantPrefixFromMatch(match[1], match[2]),
      property: match[2],
      paletteVar: match[3],
      shade: match[4],
      dynamicShade: false,
    });
  }

  const dynamicShadeRe =
    /`((?:(?:hover:|active:|focus:|dark:|disabled:)*)(bg|text|border|outline|ring|fill|stroke))-\$\{([a-zA-Z_$][\w$]*)\}-\$\{([a-zA-Z_$][\w$]*)\}`/g;

  while ((match = dynamicShadeRe.exec(content)) !== null) {
    patterns.push({
      variantPrefix: variantPrefixFromMatch(match[1], match[2]),
      property: match[2],
      paletteVar: match[3],
      shade: null,
      dynamicShade: true,
      shadeVar: match[4],
    });
  }

  return patterns;
}

/**
 * @param {string} content
 * @param {string} [filename]
 * @returns {FilePaletteSignals}
 */
export function scanPalettePatternsFromSource(content, filename = "file.tsx") {
  const signals = {
    paletteDefaults: new Map(),
    paletteUnions: new Map(),
    paletteMapKeys: new Set(),
    dynamicPaletteVars: new Set(),
    patterns: scanPalettePatternsRegex(content),
  };

  let ast;
  try {
    ast = parse(content, {
      sourceType: "module",
      sourceFilename: filename,
      plugins: ["jsx", "typescript", "decorators-legacy"],
      errorRecovery: true,
    });
  } catch {
    return signals;
  }

  traverse(ast, {
    FunctionDeclaration(path) {
      collectParamDefaults(path.node.params, signals);
    },
    FunctionExpression(path) {
      collectParamDefaults(path.node.params, signals);
    },
    ArrowFunctionExpression(path) {
      collectParamDefaults(path.node.params, signals);
    },

    CallExpression(path) {
      const callee = path.node.callee;
      if (callee.type !== "Identifier") return;
      if (callee.name === "normalizePalette" && path.node.arguments[0]?.type === "Identifier") {
        signals.dynamicPaletteVars.add(path.node.arguments[0].name);
      }
      if (callee.name === "compose") {
        const arg = path.node.arguments[0];
        if (arg?.type === "ObjectExpression") {
          for (const prop of arg.properties) {
            if (prop.type !== "ObjectProperty") continue;
            const key =
              prop.key.type === "Identifier"
                ? prop.key.name
                : prop.key.type === "StringLiteral"
                  ? prop.key.value
                  : null;
            if (key === "palette" && prop.value.type === "Identifier") {
              signals.dynamicPaletteVars.add(prop.value.name);
            }
          }
        }
      }
    },

    TSTypeAliasDeclaration(path) {
      extractUnionLiterals(path.node.id.name, path.node.typeAnnotation, signals);
    },
    TSInterfaceDeclaration(path) {
      for (const member of path.node.body.body) {
        if (member.type !== "TSPropertySignature") continue;
        const key =
          member.key.type === "Identifier"
            ? member.key.name
            : member.key.type === "StringLiteral"
              ? member.key.value
              : null;
        if (!key || !member.typeAnnotation) continue;
        if (/palette|color/i.test(key)) {
          extractUnionLiterals(key, member.typeAnnotation.typeAnnotation, signals);
        }
      }
    },

    ObjectExpression(path) {
      const paletteLikeKeys = [];
      for (const prop of path.node.properties) {
        if (prop.type !== "ObjectProperty") continue;
        if (prop.key.type === "StringLiteral" || prop.key.type === "Identifier") {
          const key = prop.key.type === "Identifier" ? prop.key.name : prop.key.value;
          if (/^(brand|danger|success|warning|info|neutral|accent|gray|white|black)/.test(key)) {
            paletteLikeKeys.push(key);
          }
        }
      }
      if (paletteLikeKeys.length >= 2) {
        paletteLikeKeys.forEach((key) => signals.paletteMapKeys.add(key));
      }
    },
  });

  return signals;
}

/**
 * @param {import('@babel/types').Node[]} params
 * @param {FilePaletteSignals} signals
 */
function collectParamDefaults(params, signals) {
  for (const param of params) {
    if (param.type === "Identifier") continue;
    if (param.type === "AssignmentPattern" && param.left.type === "Identifier") {
      const name = param.left.name;
      if (PALETTE_VAR_NAMES.has(name) || /palette|color/i.test(name)) {
        if (param.right.type === "StringLiteral") {
          signals.paletteDefaults.set(name, param.right.value);
        }
      }
    }
  }
}

/**
 * @param {string} key
 * @param {import('@babel/types').TSType | null | undefined} typeNode
 * @param {FilePaletteSignals} signals
 */
function extractUnionLiterals(key, typeNode, signals) {
  if (!typeNode) return;
  if (typeNode.type === "TSUnionType") {
    const literals = new Set();
    for (const member of typeNode.types) {
      if (member.type === "TSLiteralType" && member.literal.type === "StringLiteral") {
        literals.add(member.literal.value);
      }
    }
    if (literals.size > 0) {
      signals.paletteUnions.set(key, literals);
    }
  }
}

export { COLOR_PROPERTIES, PALETTE_VAR_NAMES, SHADE_VAR_NAMES };
