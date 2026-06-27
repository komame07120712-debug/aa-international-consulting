import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { expect, test } from 'vitest';
import Expertise from '@components/home/Expertise.astro';
import { en } from '@i18n/translations/en';

test('Expertise renders correctly', async () => {
  const container = await AstroContainer.create();
  const result = await container.renderToString(Expertise);

  expect(result).toContain(en.homeExpertise.title);
  for (const expertise of en.homeExpertise.expertises) {
    expect(result).toContain(expertise.name);
  }
});
