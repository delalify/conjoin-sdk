import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'web/index': 'src/web/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  splitting: true,
  treeshake: true,
  clean: true,
  outDir: 'dist',
  external: [
    'react',
    'react-dom',
    '@tanstack/query-core',
    '@conjoin-cloud/sdk',
    '@conjoin-cloud/sdk/relay',
    '@conjoin-cloud/sdk/storage',
    '@conjoin-cloud/sdk/billing',
    'node:crypto',
  ],
})
