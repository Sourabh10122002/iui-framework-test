import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import typescript from 'rollup-plugin-typescript2';
import terser from '@rollup/plugin-terser';

const external = [
  'iui-bootstrap',
  '@inventive-ui/icons-lucide',
  '@inventive-ui/icons-lucide/react',
  '@inventive-ui/logos',
  '@inventive-ui/logos/react',
  '@inventive-ui/icons-phosphor',
  '@inventive-ui/icons-phosphor/react',
  '@inventive-ui/material-symbols',
  '@inventive-ui/material-symbols/react',
  '@inventive-ui/icons-material',
  '@inventive-ui/icons-material/react',
  '@inventive-ui/loaders',
  '@inventive-ui/loaders/react',
  '@inventive-ui/file-types',
  '@inventive-ui/file-types/react',
  '@inventive-ui/emoji',
  '@inventive-ui/emoji/react',
  '@inventive-ui/color-logos',
  '@inventive-ui/color-logos/react',
  '@inventive-ui/illustrations',
  '@inventive-ui/illustrations/react',
  '@inventive-ui/flags',
  '@inventive-ui/flags/react',
  'react',
  'react-dom',
  'next',
  'path',
  'fs',
  'module',
  'url',
  /framework\.config/
];

/** Main entry — compile-first runtime only (no browser CSS engine). */
const indexExternal = external;

const treeshake = {
  moduleSideEffects: (id) => {
    if (id.includes('.slot.') || id.includes('slot-registry')) return true;
    return false;
  },
  propertyReadSideEffects: false,
  unknownGlobalSideEffects: false,
};

function createPlugins() {
  return [
    peerDepsExternal(),
    nodeResolve({
      extensions: ['.ts', '.tsx'],
      preferBuiltins: true,
    }),
    commonjs(),
    typescript({
      useTsconfigDeclarationDir: true,
      exclude: ['src/tokens/**/index.ts', 'iui.config.ts', '**/node_modules/**'],
      tsconfigOverride: {
        compilerOptions: {
          target: 'ES2022',
          module: 'ES2022',
          jsx: 'react-jsx',
          skipLibCheck: true,
          declaration: true,
          declarationDir: 'dist',
          declarationMap: false,
          sourceMap: false,
          emitDeclarationOnly: false,
          esModuleInterop: true,
          moduleResolution: 'node',
          allowSyntheticDefaultImports: true,
          downlevelIteration: true,
        },
        include: ['src/**/*', 'src/.generated/**/*'],
        exclude: ['**/*.stories.tsx', '**/*.test.tsx', 'src/tokens/**/index.ts', 'node_modules', 'dist', 'iui.config.ts'],
      },
    }),
    terser({
      maxWorkers: 1,
      compress: {
        passes: 3,
        pure_getters: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        inline: 2,
        sequences: true,
        dead_code: true,
        conditionals: true,
        booleans: true,
        unused: true,
        if_return: true,
        join_vars: true,
        collapse_vars: true,
        reduce_vars: true,
        hoist_funs: true,
        hoist_vars: true,
        side_effects: true,
        global_defs: {
          'process.env.NODE_ENV': '"production"'
        }
      },
      mangle: {
        toplevel: true,
        eval: true,
        keep_fnames: false,
        properties: {
          regex: /^_/
        }
      },
      format: {
        comments: false,
        ascii_only: false,
        max_line_len: false,
        beautify: false,
        ecma: 2018
      },
      ecma: 2018,
      toplevel: true
    }),
  ];
}

const shared = {
  treeshake,
};

export default [
  {
    ...shared,
    plugins: createPlugins(),
    external: indexExternal,
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.cjs',
        format: 'cjs',
        sourcemap: false,
        exports: 'named',
      },
      {
        file: 'dist/index.esm.js',
        format: 'esm',
        sourcemap: false,
        exports: 'named',
      },
    ],
  },
  {
    ...shared,
    plugins: createPlugins(),
    external,
    input: 'src/slots.ts',
    output: [
      {
        file: 'dist/slots.cjs',
        format: 'cjs',
        sourcemap: false,
        exports: 'named',
      },
      {
        file: 'dist/slots.esm.js',
        format: 'esm',
        sourcemap: false,
        exports: 'named',
      },
    ],
  },
  {
    ...shared,
    plugins: createPlugins(),
    external,
    input: 'src/shade.ts',
    output: [
      {
        file: 'dist/shade.cjs',
        format: 'cjs',
        sourcemap: false,
        exports: 'named',
      },
      {
        file: 'dist/shade.esm.js',
        format: 'esm',
        sourcemap: false,
        exports: 'named',
      },
    ],
  },
];
