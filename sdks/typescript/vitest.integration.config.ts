import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './tests/coverage-integration',
      include: ['src/**/*.ts', 'src/**/*.tsx', 'tests/integration/**/*.ts'],
      exclude: ['src/generated/**', 'src/**/__tests__/**', '**/*.test.ts', '**/*.test.tsx'],
    },
  },
})
