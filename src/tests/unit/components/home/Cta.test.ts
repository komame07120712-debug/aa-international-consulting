import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { expect, test } from 'vitest';
import Cta from '@components/home/Cta.astro';
import { en } from '@i18n/translations/en';

test('Cta renders correctly', async () => {
  const container = await AstroContainer.create();
  const result = await container.renderToString(Cta);

  expect(result).toContain(en.homeCta.description);
  expect(result).toContain(en.homeCta.contact);
  expect(result).toContain(en.homeCta.pricing);
});
