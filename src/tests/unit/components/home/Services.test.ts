import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { expect, test } from 'vitest';
import Services from '@components/home/Services.astro';
import { en } from '@i18n/translations/en';

test('Services renders correctly', async () => {
  const container = await AstroContainer.create();
  const result = await container.renderToString(Services);

  expect(result).toContain(en.homeServices.title);
  for (const service of en.homeServices.services) {
    expect(result).toContain(service.name);
  }
});
