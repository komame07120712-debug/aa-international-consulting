import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { expect, test } from 'vitest';
import Header from '@components/layout/Header.astro';
import { en } from '@i18n/translations/en';

test('Header renders correctly', async () => {
  const container = await AstroContainer.create();
  const result = await container.renderToString(Header);

  expect(result).toContain(en.layoutHeader.home);
  expect(result).toContain(en.layoutHeader.about);
  expect(result).toContain(en.layoutHeader.pricing);
  expect(result).toContain(en.layoutHeader.contact);
});
