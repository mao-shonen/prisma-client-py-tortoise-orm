import * as esbuild from 'esbuild'
import { dependencies } from '../package.json'

esbuild.build({
  entryPoints: ['./src/index.ts'],
  outfile: 'dist/index.cjs',
  platform: 'node',
  target: 'node12',
  bundle: true,
  format: 'cjs',
  external: Object.keys(dependencies),
})

esbuild.build({
  entryPoints: ['./src/index.ts'],
  outfile: 'dist/index.mjs',
  platform: 'node',
  target: 'node12',
  bundle: true,
  format: 'esm',
  external: Object.keys(dependencies),
})
