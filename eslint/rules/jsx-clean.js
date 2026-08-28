export default {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow inline logic and raw class strings inside JSX",
    },
  },
  create(context) {
    return {
      JSXExpressionContainer(node) {

        /** Avoid inline ternaries inside JSX */
        if (node.expression.type === "ConditionalExpression") {
          context.report({
            node,
            message:
              "Avoid inline ternaries inside JSX. Extract logic above JSX.",
          });
        }

        /** Avoid defining functions inline inside JSX */
        if (
          node.expression.type === "ArrowFunctionExpression" ||
          node.expression.type === "FunctionExpression"
        ) {
          context.report({
            node,
            message:
              "Avoid defining functions inline inside JSX. Move them outside.",
          });
        }
      },

      /** Avoid hardcoded Tailwind classes */
      JSXAttribute(node) {
        if (node.name.name === "className" && node.value?.type === "Literal") {
          context.report({
            node,
            message:
              "Avoid hardcoded Tailwind classes directly in JSX. Use config-driven styles instead.",
          });
        }
      },
    };
  },
};
