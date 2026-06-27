import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { expect, test } from 'vitest';
import About from '@components/home/About.astro';
import { en } from '@i18n/translations/en';

test('About renders correctly', async () => {
  const container = await AstroContainer.create();
  const result = await container.renderToString(About);

  expect(result).toContain(en.homeAbout.title);
  expect(result).toContain(en.homeAbout.description);
  expect(result).toContain(en.homeAbout.cta);
});
