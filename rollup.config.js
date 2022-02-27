import json from '@rollup/plugin-json'
import { terser } from 'rollup-plugin-terser'
import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve'

import { dependencies } from './package.json'

const external = Object.keys(dependencies || '')
const globals = external.reduce((prev, current) => {
  const newPrev = prev

  newPrev[current] = current
  return newPrev
}, {})

export default {
  input: './src/index.ts',
  output: {
    globals,
    format: 'cjs',
    file: './lib/index.js',
    banner: '#!/usr/bin/env node'
  },
  external,
  plugins: [nodeResolve(), typescript(), json(), terser()]
}
