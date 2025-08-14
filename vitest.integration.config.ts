import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    // Only run integration tests
    include: ['test/integration.test.ts']
  }
});