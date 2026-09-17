import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/app/cms/**/*.spec.ts', 'src/app/services/chat.spec.ts'],
    environment: 'node',
    setupFiles: ['src/app/cms/vitest-setup.ts'],
  },
});
