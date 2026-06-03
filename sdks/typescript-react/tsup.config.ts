import { cpSync } from 'node:fs'
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  splitting: true,
  treeshake: false,
  clean: true,
  outDir: 'dist',
  external: [
    'react',
    'react-dom',
    '@tanstack/query-core',
    '@conjoin-cloud/sdk',
    '@conjoin-cloud/react-core',
    '@conjoin-cloud/react-core/web',
    'node:crypto',
    '@radix-ui/react-avatar',
    '@radix-ui/react-dropdown-menu',
    '@radix-ui/react-label',
    '@radix-ui/react-popover',
    '@radix-ui/react-separator',
    '@radix-ui/react-tabs',
    '@radix-ui/react-visually-hidden',
  ],
  onSuccess: async () => {
    cpSync('src/styles/conjoin.css', 'dist/styles.css')
  },
})
