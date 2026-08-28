export default {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Enforce naming conventions for variables, constants, and components",
    },
  },
  create(context) {
    return {
      VariableDeclarator(node) {
        const name = node.id.name;
        // Constants
        if (
          node.init &&
          typeof node.init.value !== "undefined" &&
          /^[A-Z0-9_]+$/.test(name)
        )
          return;

        // Booleans must be prefixed
        if (
          node.init?.type === "Literal" &&
          typeof node.init.value === "boolean"
        ) {
          if (!/^(is|has|should|can|do)[A-Z]/.test(name)) {
            context.report({
              node,
              message: `Boolean variables must be prefixed (is/has/should/can/do). Found: ${name}`,
            });
          }
        }
      },
    };
  },
};
