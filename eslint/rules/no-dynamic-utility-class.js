/**
 * Flag template-literal IUI utility class construction that the compile-first
 * scanner cannot discover (e.g. `p-${n}`, `bg-${color}-500` outside map engines).
 *
 * Escape hatch: // eslint-disable-next-line customPlugin/no-dynamic-utility-class
 * Map engines / generators: allowlisted via filename defaults (styles/, *.generated.*).
 */

const UTILITY_HINT =
  /(?:^|[\s"'`])((?:[!]?[\w-]+:)*?)(bg|text|border|outline|ring|p|px|py|pt|pb|ps|pe|pl|pr|m|mx|my|mt|mb|ms|me|ml|mr|w|h|min-w|min-h|max-w|max-h|gap|space|rounded|shadow|opacity|z|inset|top|bottom|start|end|left|right|flex|grid|col|row|font|leading|tracking|decoration|underline|truncate|overflow|cursor|pointer-events|select|whitespace|break|items|justify|content|self|place|object|aspect|basis|grow|shrink|order|visible|invisible|sr-only)-/;

const DEFAULT_ALLOW =
  /(\\|\/)(styles|maps)(\\|\/)|\.generated\.|(generate-style-maps|style-map-contract|add-slots|scan-used-classes)/i;

function quasiLooksLikeUtility(quasi) {
  const value = quasi?.value?.cooked ?? quasi?.value?.raw ?? "";
  return UTILITY_HINT.test(value) || /(?:^|[\s])[!]?[\w-]*-$/.test(value);
}

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow dynamic IUI utility class templates that compile-first cannot scan",
    },
    schema: [
      {
        type: "object",
        properties: {
          allowPathPattern: { type: "string" },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      dynamicUtility:
        "DYNAMIC UTILITY: template `{{preview}}` cannot be statically scanned. Use a static class string, a style map, or safelist — or disable with eslint-disable-next-line customPlugin/no-dynamic-utility-class for intentional map engines.",
    },
  },
  create(context) {
    const options = context.options?.[0] ?? {};
    const allowRe = options.allowPathPattern
      ? new RegExp(options.allowPathPattern, "i")
      : DEFAULT_ALLOW;
    const filename = context.filename || context.getFilename?.() || "";

    if (allowRe.test(filename.replace(/\\/g, "/"))) {
      return {};
    }

    return {
      TemplateLiteral(node) {
        if (!node.expressions?.length) return;
        const hasUtilityQuasi = node.quasis.some(quasiLooksLikeUtility);
        if (!hasUtilityQuasi) return;

        const preview = node.quasis
          .map((q, i) => `${q.value.cooked ?? ""}${i < node.expressions.length ? "${…}" : ""}`)
          .join("")
          .slice(0, 80);

        context.report({
          node,
          messageId: "dynamicUtility",
          data: { preview },
        });
      },
    };
  },
};
