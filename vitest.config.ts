/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'lcov', 'cobertura'],
      exclude: ['src/assets/**', 'src/i18n/translation.ts', 'src/utils/*.ts', 'src/scripts/dna-background.ts'],
    },
  },
});
