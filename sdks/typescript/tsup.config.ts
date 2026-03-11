import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    'core/index': 'src/core/index.ts',
    'auth/index': 'src/auth/index.ts',
    'database/index': 'src/database/index.ts',
    'storage/index': 'src/storage/index.ts',
    'messaging/index': 'src/messaging/index.ts',
    'billing/index': 'src/billing/index.ts',
    'relay/index': 'src/relay/index.ts',
    'ai/index': 'src/ai/index.ts',
    'runtime/index': 'src/runtime/index.ts',
    'cloud/index': 'src/cloud/index.ts',
    'react/index': 'src/react/index.ts',
    'server/index': 'src/server/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  splitting: true,
  treeshake: true,
  clean: true,
  outDir: 'dist',
  define: {
    __CONJOIN_SDK_VERSION__: JSON.stringify(process.env.npm_package_version ?? '0.0.1'),
  },
})
