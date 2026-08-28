/**
 * Build config subpath: dist/config.cjs, dist/config.esm.js
 * Used for @inventive-ui/framework/config (iui.config.ts)
 */
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import typescript from 'rollup-plugin-typescript2';

export default {
  input: 'src/core/config.ts',
  output: [
    { file: 'dist/config.cjs', format: 'cjs', exports: 'named' },
    { file: 'dist/config.esm.js', format: 'esm', exports: 'named' },
  ],
  external: ['react', 'react-dom'],
  plugins: [
    peerDepsExternal(),
    nodeResolve({ extensions: ['.ts', '.tsx'], preferBuiltins: true }),
    commonjs(),
    typescript({
      tsconfigOverride: {
        compilerOptions: {
          declaration: false,
          target: 'ES2022',
          module: 'ES2022',
        },
        include: ['src/core/config.ts', 'src/core/states/**/*'],
      },
    }),
  ],
};
