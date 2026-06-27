import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { expect, test } from 'vitest';
import Heading from '@components/pricing/Heading.astro';
import { en } from '@i18n/translations/en';

test('Pricing Heading renders correctly', async () => {
  const container = await AstroContainer.create();
  const result = await container.renderToString(Heading);

  expect(result).toContain(en.pricingHeading.title);
  expect(result).toContain(en.pricingHeading.description);
});
