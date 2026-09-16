import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/app/cms/**/*.spec.ts'],
    environment: 'node',
  },
});
