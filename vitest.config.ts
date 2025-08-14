import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/*.config.ts'
      ]
    },
    // Only include our own test files
    include: ['src/**/*.test.ts'],
    // Exclude integration tests by default - they should only run in Docker
    exclude: ['test/integration.test.ts', 'node_modules/**']
  }
});