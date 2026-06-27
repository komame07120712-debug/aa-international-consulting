import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { expect, test } from 'vitest';
import Cta from '@components/pricing/Cta.astro';
import { en } from '@i18n/translations/en';

test('Pricing Cta renders correctly', async () => {
  const container = await AstroContainer.create();
  const result = await container.renderToString(Cta);

  expect(result).toContain(en.pricingCta.title);
  expect(result).toContain(en.pricingCta.action);
});
