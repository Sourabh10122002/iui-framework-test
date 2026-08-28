export default {
  meta: {
    type: "suggestion",
    fixable: "code",
    messages: {
      noTrailing123:
        "NAMING RULE: Identifier '{{name}}' should not end with '123'.",
    },
  },
  create(context) {
    return {
      Program(node) {
        const filename = context.filename.split("/").pop();
        if (!/^[A-Z][A-Za-z0-9]+\.tsx?$/.test(filename)) {
          context.report({
            node,
            message:
              "React component files should use PascalCase (e.g. Button.tsx)",
          });
        }
      },
    };
  },
};
