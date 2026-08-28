export default {
  meta: {
    type: "suggestion",
    fixable: "code",
    messages: {
      noArbitraryPx:
        "ARBITARY RULE: using arbitrary pixel values '{{value}}'. Use IUI scale (divide by 4 → '{{replacement}}').",
    },
  },
  /**
   * Write rule logic here
   */
  create(context) {
    return {
      Literal(node) {
        if (typeof node.value === "string") {
          const regex = /\[(\d+)px\]/g;
          let match;
          while ((match = regex.exec(node.value)) !== null) {
            const pxValue = Number(match[1]);
            const converted = (pxValue / 4).toString();
            const replacement = node.value.replace(match[0], converted);
            context.report({
              node,
              messageId: "noArbitraryPx",
              data: {
                value: match[0],
                replacement,
              },
              /** Fixer code write here */
              fix(fixer) {
                // Replace the entire string literal text (including quotes)
                const raw = node.raw; // e.g. "'px-[8px]'" or '"px-[8px]"'
                const quote = raw.startsWith("'") ? "'" : '"';
                const fixed = quote + replacement + quote;
                return fixer.replaceText(node, fixed);
              },
            });
          }
        }
      },
    };
  },
};
