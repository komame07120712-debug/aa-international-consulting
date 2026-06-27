import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { expect, test } from 'vitest';
import Faq from '@components/pricing/Faq.astro';
import { en } from '@i18n/translations/en';

test('Faq renders correctly', async () => {
  const container = await AstroContainer.create();
  const result = await container.renderToString(Faq);

  expect(result).toContain(en.pricingFaq.title);
  for (const question of en.pricingFaq.questions) {
    expect(result).toContain(question.title);
  }
});
