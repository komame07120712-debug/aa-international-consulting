import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { expect, test } from 'vitest';
import Hero from '@components/home/Hero.astro';
import { en } from '@i18n/translations/en';

test('Hero renders correctly', async () => {
  const container = await AstroContainer.create();
  const result = await container.renderToString(Hero);

  expect(result).toContain(en.homeHero.description);
});
