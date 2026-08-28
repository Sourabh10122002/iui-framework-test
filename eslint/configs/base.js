import js from "@eslint/js";

export default {
  name: "uzence/base",
  ...js.configs.recommended,
  rules: {
    "no-console": "warn",
    "no-debugger": "error",
    semi: "error",
  },
};
