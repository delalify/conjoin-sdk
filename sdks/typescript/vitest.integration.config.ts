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
      exclude: ['src/generated/api-types.ts', 'src/**/__tests__/**', '**/*.test.ts', '**/*.test.tsx'],
      thresholds: {
        branches: 90,
        functions: 90,
        lines: 90,
        statements: 90,
      },
    },
  },
})
