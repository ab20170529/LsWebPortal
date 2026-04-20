import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
    environment: 'jsdom',
    globals: true,
    include: [
      'packages/products/bi/src/**/*.test.ts',
      'packages/products/bi/src/**/*.test.tsx',
    ],
  },
});
