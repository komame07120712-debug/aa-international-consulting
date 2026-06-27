import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { expect, test } from 'vitest';
import Values from '@components/about/Values.astro';
import { en } from '@i18n/translations/en';

test('Values renders correctly', async () => {
  const container = await AstroContainer.create();
  const result = await container.renderToString(Values);

  expect(result).toContain(en.aboutValues.title);
  for (const column of en.aboutValues.values) {
    for (const value of column) {
      expect(result).toContain(value.name);
    }
  }
});
