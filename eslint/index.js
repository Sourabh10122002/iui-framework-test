import base from "./configs/base.js";
import react from "./configs/react.js";
import typescript from "./configs/typescript.js";
import namingRules from "./rules/naming-rule.js";
import arbitaryRule from "./rules/arbitary-rule.js";
import cleanJsxRule from "./rules/jsx-clean.js";
import enforceNaming from "./rules/enforce-naming.js";
import noDynamicUtilityClass from "./rules/no-dynamic-utility-class.js";

export default {
  customPlugin: {
    plugins: {
      customPlugin: {
        rules: {
          "no-arbitrary-px": arbitaryRule,
          "naming-rule": namingRules,
          "clean-jsx": cleanJsxRule,
          "enforce-naming": enforceNaming,
          "no-dynamic-utility-class": noDynamicUtilityClass,
        },
      },
    },
    rules: {
      "customPlugin/no-arbitrary-px": "warn",
      // "customPlugin/naming-rule": "warn",
      "customPlugin/clean-jsx": "warn",
      "customPlugin/enforce-naming": "warn",
      "customPlugin/no-dynamic-utility-class": "warn",
    },
  },
  configs: {
    base,
    react,
    typescript,
  },
};
