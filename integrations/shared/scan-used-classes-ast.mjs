import { parse } from "@babel/parser";
import _traverse from "@babel/traverse";
import { addFilteredClassTokens } from "./utility-token-filter.mjs";
import { loadShadeApi } from "./load-shade-api.mjs";

const traverse = _traverse.default ?? _traverse;
const shadeApi = loadShadeApi();

const CN_CALLEES = new Set(["cn", "cx", "clsx", "iuimerge", "cva"]);
const SHADE_METHODS = new Set(["compose", "stack", "slice", "channel"]);
const ROOT_PACKAGE = "@inventive-ui/framework";
const SHADE_PACKAGE = "@inventive-ui/framework/shade";

/** @param {Set<string>} set @param {string} raw */
function addClassTokens(set, raw) {
  addFilteredClassTokens(set, raw);
}

/** @param {import('@babel/types').Node | null | undefined} node @param {Set<string>} classes */
function extractFromExpression(node, classes) {
  if (!node) return;

  switch (node.type) {
    case "StringLiteral":
      addClassTokens(classes, node.value);
      break;
    case "TemplateLiteral":
      for (const quasi of node.quasis) {
        if (quasi.value?.raw) addClassTokens(classes, quasi.value.raw);
      }
      break;
    case "ObjectExpression":
      for (const prop of node.properties) {
        if (prop.type !== "ObjectProperty") continue;
        if (prop.value.type === "StringLiteral") {
          addClassTokens(classes, prop.value.value);
        } else {
          extractFromExpression(prop.value, classes);
        }
      }
      break;
    case "ArrayExpression":
      for (const el of node.elements) {
        if (el) extractFromExpression(el, classes);
      }
      break;
    case "ConditionalExpression":
      extractFromExpression(node.consequent, classes);
      extractFromExpression(node.alternate, classes);
      break;
    case "LogicalExpression":
      extractFromExpression(node.left, classes);
      extractFromExpression(node.right, classes);
      break;
    case "BinaryExpression":
      // ` "flex " + OTHER_CLASS ` / string concatenation of utility lists
      if (node.operator === "+") {
        extractFromExpression(node.left, classes);
        extractFromExpression(node.right, classes);
      }
      break;
    default:
      break;
  }
}

/** @param {import('@babel/types').Node | null | undefined} node */
function unwrapStaticNode(node) {
  let current = node;
  while (
    current &&
    (current.type === "TSAsExpression" ||
      current.type === "TSTypeAssertion" ||
      current.type === "TSNonNullExpression" ||
      current.type === "ParenthesizedExpression")
  ) {
    current = current.expression;
  }
  return current;
}

/** @param {import('@babel/traverse').NodePath} path */
function resolveConstInitializer(path) {
  if (!path?.isIdentifier?.()) return null;
  const binding = path.scope.getBinding(path.node.name);
  if (
    !binding ||
    binding.kind !== "const" ||
    !binding.constant ||
    binding.constantViolations.length > 0 ||
    !binding.path.isVariableDeclarator()
  ) {
    return null;
  }
  return binding.path.get("init");
}

/**
 * Evaluate only literal request data. No JavaScript is executed.
 * @param {import('@babel/traverse').NodePath | null} inputPath
 * @param {Set<import('@babel/types').Node>} seen
 * @returns {{ ok: true, value: unknown } | { ok: false, reason: string }}
 */
function evaluateStaticValue(inputPath, seen = new Set()) {
  if (!inputPath?.node) return { ok: false, reason: "missing request argument" };

  let path = inputPath;
  let node = unwrapStaticNode(path.node);
  while (node !== path.node) {
    path = path.get("expression");
    node = unwrapStaticNode(path.node);
  }

  if (seen.has(node)) return { ok: false, reason: "cyclic const alias" };
  seen.add(node);

  if (node.type === "StringLiteral" || node.type === "BooleanLiteral") {
    return { ok: true, value: node.value };
  }

  if (node.type === "Identifier") {
    const init = resolveConstInitializer(path);
    if (!init) {
      return { ok: false, reason: `runtime or mutable identifier "${node.name}"` };
    }
    return evaluateStaticValue(init, seen);
  }

  if (node.type === "TemplateLiteral") {
    return {
      ok: false,
      reason:
        node.expressions.length > 0
          ? "template expression"
          : "template literal (use a string literal)",
    };
  }

  if (node.type !== "ObjectExpression") {
    const labels = {
      CallExpression: "function call",
      MemberExpression: "runtime member access",
      ConditionalExpression: "conditional expression",
    };
    return {
      ok: false,
      reason: labels[node.type] ?? `dynamic ${node.type}`,
    };
  }

  const value = {};
  const properties = path.get("properties");
  for (const propPath of properties) {
    const prop = propPath.node;
    if (prop.type === "SpreadElement") {
      return { ok: false, reason: "object spread" };
    }
    if (prop.type !== "ObjectProperty") {
      return { ok: false, reason: "object method" };
    }
    if (prop.computed) {
      return { ok: false, reason: "computed object key" };
    }
    const key =
      prop.key.type === "Identifier"
        ? prop.key.name
        : prop.key.type === "StringLiteral"
          ? prop.key.value
          : null;
    if (key == null) return { ok: false, reason: "non-literal object key" };

    const evaluated = evaluateStaticValue(propPath.get("value"), new Set(seen));
    if (!evaluated.ok) return evaluated;
    value[key] = evaluated.value;
  }
  return { ok: true, value };
}

/**
 * @param {import('@babel/traverse').NodePath} calleePath
 * @param {{ rootShade: Map<string, import('@babel/types').Node>, direct: Map<string, { method: string, node: import('@babel/types').Node }>, namespaces: Map<string, import('@babel/types').Node> }} bindings
 * @param {Set<import('@babel/types').Node>} seen
 * @returns {string | null}
 */
function resolveShadeMethod(calleePath, bindings, seen = new Set()) {
  if (!calleePath?.node || seen.has(calleePath.node)) return null;
  seen.add(calleePath.node);
  const node = unwrapStaticNode(calleePath.node);

  if (node.type === "Identifier") {
    const binding = calleePath.scope.getBinding(node.name);
    const direct = bindings.direct.get(node.name);
    if (direct && binding?.path.node === direct.node) return direct.method;

    const init = resolveConstInitializer(calleePath);
    return init ? resolveShadeMethod(init, bindings, seen) : null;
  }

  if (
    node.type !== "MemberExpression" ||
    node.computed ||
    node.property.type !== "Identifier" ||
    !SHADE_METHODS.has(node.property.name) ||
    node.object.type !== "Identifier"
  ) {
    return null;
  }

  const objectBinding = calleePath.scope.getBinding(node.object.name);
  if (
    objectBinding?.path.node === bindings.rootShade.get(node.object.name) ||
    objectBinding?.path.node === bindings.namespaces.get(node.object.name)
  ) {
    return node.property.name;
  }
  return null;
}

function diagnosticFor(path, filename, method, reason) {
  const line = path.node.loc?.start.line ?? 0;
  return {
    code: "IUI_SHADE_DYNAMIC",
    filename,
    line,
    method,
    reason,
    message:
      `[IUI shade scan] ${filename}:${line} cannot statically expand ${method}(): ${reason}. ` +
      "Use a static generated map/finite literal domain, or explicitly enable build.includeShadeMatrix.",
  };
}

function markShadeRequestInput(inputPath, roots, seen = new Set()) {
  if (!inputPath?.node || seen.has(inputPath.node)) return;
  seen.add(inputPath.node);
  roots.add(inputPath.node);

  const node = inputPath.node;
  if (
    node.type === "TSAsExpression" ||
    node.type === "TSTypeAssertion" ||
    node.type === "TSNonNullExpression" ||
    node.type === "ParenthesizedExpression"
  ) {
    markShadeRequestInput(inputPath.get("expression"), roots, seen);
    return;
  }
  if (node.type === "Identifier") {
    const init = resolveConstInitializer(inputPath);
    if (init) markShadeRequestInput(init, roots, seen);
    return;
  }
  if (node.type === "ObjectExpression") {
    for (const propPath of inputPath.get("properties")) {
      if (propPath.isSpreadElement()) {
        markShadeRequestInput(propPath.get("argument"), roots, seen);
      } else if (propPath.isObjectProperty()) {
        markShadeRequestInput(propPath.get("value"), roots, seen);
      }
    }
  }
}

function isInsideShadeRequest(path, roots) {
  let current = path;
  while (current) {
    if (roots.has(current.node)) return true;
    current = current.parentPath;
  }
  return false;
}

/**
 * AST-based class extraction (M4) — JSX attributes, cn/cva spreads, conditionals,
 * object-map style tables, array literals, and exported class-string constants.
 *
 * Exported consts like `export const FOO_CLASS = "fixed end-6 …"` must be scanned:
 * `className={FOO_CLASS}` has no literal in the JSX site, so the defining module
 * is the only place those tokens appear.
 *
 * @param {string} content
 * @param {string} [filename]
 * @param {{ onDiagnostic?: (diagnostic: Record<string, unknown>) => void }} [options]
 * @returns {Set<string> & { diagnostics?: Record<string, unknown>[] }}
 */
export function extractClassesFromSourceAST(
  content,
  filename = "file.tsx",
  options = {},
) {
  const classes = new Set();
  const diagnostics = [];

  let ast;
  try {
    ast = parse(content, {
      sourceType: "module",
      sourceFilename: filename,
      plugins: ["jsx", "typescript", "decorators-legacy"],
      errorRecovery: true,
    });
  } catch {
    return classes;
  }

  const bindings = {
    rootShade: new Map(),
    direct: new Map(),
    namespaces: new Map(),
  };
  for (const statement of ast.program.body) {
    if (statement.type !== "ImportDeclaration") continue;
    const source = statement.source.value;
    if (source !== ROOT_PACKAGE && source !== SHADE_PACKAGE) continue;
    for (const specifier of statement.specifiers) {
      if (
        source === ROOT_PACKAGE &&
        specifier.type === "ImportSpecifier" &&
        (specifier.imported.type === "Identifier"
          ? specifier.imported.name
          : specifier.imported.value) === "shade"
      ) {
        bindings.rootShade.set(specifier.local.name, specifier);
      } else if (
        source === SHADE_PACKAGE &&
        specifier.type === "ImportSpecifier"
      ) {
        const imported =
          specifier.imported.type === "Identifier"
            ? specifier.imported.name
            : specifier.imported.value;
        if (SHADE_METHODS.has(imported)) {
          bindings.direct.set(specifier.local.name, {
            method: imported,
            node: specifier,
          });
        }
      } else if (
        source === SHADE_PACKAGE &&
        specifier.type === "ImportNamespaceSpecifier"
      ) {
        bindings.namespaces.set(specifier.local.name, specifier);
      }
    }
  }

  const shadeCallNodes = new Set();
  const shadeRequestRoots = new Set();
  traverse(ast, {
    CallExpression(path) {
      const method = resolveShadeMethod(path.get("callee"), bindings);
      if (!method) return;
      shadeCallNodes.add(path.node);

      const args = path.get("arguments");
      for (const arg of args) markShadeRequestInput(arg, shadeRequestRoots);
      const evaluated =
        args.length === 1 && !args[0].isSpreadElement()
          ? evaluateStaticValue(args[0])
          : {
              ok: false,
              reason:
                args.length !== 1
                  ? "expected exactly one request object"
                  : "spread argument",
            };

      if (evaluated.ok) {
        try {
          addClassTokens(classes, shadeApi[method](evaluated.value));
          return;
        } catch (error) {
          const diagnostic = diagnosticFor(
            path,
            filename,
            method,
            `invalid literal request: ${error instanceof Error ? error.message : String(error)}`,
          );
          diagnostics.push(diagnostic);
          options.onDiagnostic?.(diagnostic);
          return;
        }
      }

      const diagnostic = diagnosticFor(
        path,
        filename,
        method,
        evaluated.reason,
      );
      diagnostics.push(diagnostic);
      options.onDiagnostic?.(diagnostic);
    },
  });

  traverse(ast, {
    JSXAttribute(path) {
      const name = path.node.name;
      const attrName =
        name.type === "JSXIdentifier"
          ? name.name
          : name.type === "JSXNamespacedName"
            ? name.name.name
            : null;
      if (attrName !== "className" && attrName !== "class") return;

      const value = path.node.value;
      if (!value) return;

      if (value.type === "StringLiteral") {
        addClassTokens(classes, value.value);
        return;
      }

      if (value.type === "JSXExpressionContainer") {
        extractFromExpression(value.expression, classes);
      }
    },

    CallExpression(path) {
      if (shadeCallNodes.has(path.node)) {
        path.skip();
        return;
      }
      const callee = path.node.callee;
      if (callee.type === "Identifier" && CN_CALLEES.has(callee.name)) {
        for (const arg of path.node.arguments) {
          extractFromExpression(arg, classes);
        }
      }
    },

    ObjectProperty(path) {
      if (isInsideShadeRequest(path, shadeRequestRoots)) return;
      if (path.parent.type !== "ObjectExpression") return;
      const { value } = path.node;
      // String, concat, ternary, etc. — same as VariableDeclarator class strings.
      extractFromExpression(value, classes);
    },

    ArrayExpression(path) {
      if (isInsideShadeRequest(path, shadeRequestRoots)) return;
      if (path.parent.type === "CallExpression") return;
      for (const el of path.node.elements) {
        if (el) extractFromExpression(el, classes);
      }
    },

    /**
     * `export const DOC_ON_THIS_PAGE_FIXED_CLASS = "fixed end-6 top-1/2 …"`
     * Objects/arrays are handled by ObjectProperty / ArrayExpression visitors.
     */
    VariableDeclarator(path) {
      const { init } = path.node;
      if (!init) return;
      if (shadeRequestRoots.has(init)) return;
      if (init.type === "ObjectExpression" || init.type === "ArrayExpression") {
        return;
      }
      extractFromExpression(init, classes);
    },
  });

  Object.defineProperty(classes, "diagnostics", {
    value: diagnostics,
    enumerable: false,
  });
  return classes;
}
