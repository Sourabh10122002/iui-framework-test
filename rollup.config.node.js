/**
 * Node compile-time bundles — no browser obfuscation.
 * Emits dist/node (build CSS API) and dist/server/index.esm.js (./server export).
 */
import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "rollup-plugin-typescript2";

const nodeBuiltins = [
  "fs",
  "path",
  "url",
  "module",
  "crypto",
  "os",
  "util",
  "stream",
  "worker_threads",
  "assert",
  "events",
];

const external = (id) =>
  id === "react" ||
  id === "react-dom" ||
  id === "react/jsx-runtime" ||
  id === "react/jsx-dev-runtime" ||
  id.startsWith("node:") ||
  nodeBuiltins.includes(id) ||
  id.startsWith("@inventive-ui/");

function createPlugins() {
  return [
    nodeResolve({
      extensions: [".ts", ".tsx", ".js", ".mjs"],
      preferBuiltins: true,
    }),
    commonjs(),
    typescript({
      tsconfigOverride: {
        compilerOptions: {
          target: "ES2022",
          module: "ES2022",
          jsx: "react-jsx",
          skipLibCheck: true,
          declaration: false,
          declarationMap: false,
          sourceMap: false,
          esModuleInterop: true,
          moduleResolution: "node",
          allowSyntheticDefaultImports: true,
        },
        include: ["src/**/*", "src/.generated/**/*"],
        exclude: [
          "**/*.stories.tsx",
          "**/*.test.tsx",
          "**/*.test.ts",
          "node_modules",
          "dist",
          "iui.config.ts",
        ],
      },
      clean: true,
    }),
  ];
}

export default [
  {
    input: "src/server/build-css-api.ts",
    external,
    plugins: createPlugins(),
    output: [
      {
        file: "dist/node/build-css-api.mjs",
        format: "esm",
        exports: "named",
        sourcemap: false,
      },
      {
        file: "dist/node/build-css-api.cjs",
        format: "cjs",
        exports: "named",
        sourcemap: false,
      },
    ],
  },
  {
    input: "src/server/index.ts",
    external,
    plugins: createPlugins(),
    output: [
      {
        file: "dist/server/index.esm.js",
        format: "esm",
        exports: "named",
        sourcemap: false,
      },
      {
        file: "dist/server/index.cjs",
        format: "cjs",
        exports: "named",
        sourcemap: false,
      },
    ],
  },
];
