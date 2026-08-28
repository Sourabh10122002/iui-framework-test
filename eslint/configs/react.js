import pluginReact from "eslint-plugin-react";

export default {
  name: "uzence/react",
  plugins: { react: pluginReact },
  ...pluginReact.configs.flat.recommended,
  settings: {
    react: { version: "detect" },
  },
  rules: {
    "react/jsx-uses-react": "warn",
    "react/react-in-jsx-scope": "warn",
  },
};
