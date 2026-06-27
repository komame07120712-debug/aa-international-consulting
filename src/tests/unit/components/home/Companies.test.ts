import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { expect, test } from 'vitest';
import Companies from '@components/home/Companies.astro';
import { en } from '@i18n/translations/en';

test('Companies renders correctly', async () => {
  const container = await AstroContainer.create();
  const result = await container.renderToString(Companies);

  expect(result).toContain(en.homeCompanies.title);
  for (const company of en.homeCompanies.companies) {
    expect(result).toContain(company.name);
  }
});
