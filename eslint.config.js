import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import { defineConfig } from "eslint/config";
import uzence from "./eslint/index.js";

export default defineConfig([
  // 1. Global ignores
  {
    ignores: [
      ".storybook",
      "build",
      "coverage",
      "dist",
      "eslint.config.js",
      "eslint",
      "lib",
      "node_modules",
      "public",
      "storybook-static",
      "rollup.config.js",
    ],
  },

  // 2. Base language setup
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      globals: globals.browser,
      parser: tsParser, // 👈 enables TS syntax
    },
    settings: {
      react: {
        version: "detect", // 👈 auto-detect your installed React version
      },
    },
  },

  // 3. Core config layers
  uzence.configs.base,
  uzence.configs.typescript,
  uzence.configs.react,

  // 4. Custom rules last
  uzence.customPlugin,
]);
