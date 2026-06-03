import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  splitting: true,
  treeshake: true,
  clean: true,
  outDir: 'dist',
  external: [
    'react',
    'expo-secure-store',
    '@conjoin-cloud/sdk',
    '@conjoin-cloud/react-core',
  ],
})
