import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { expect, test } from 'vitest';
import ContactInfo from '@components/contact/ContactInfo.astro';
import { en } from '@i18n/translations/en';

test('ContactInfo renders correctly', async () => {
  const container = await AstroContainer.create();
  const result = await container.renderToString(ContactInfo);

  expect(result).toContain(en.contactInfo.address);
  expect(result).toContain(en.contactInfo.location);
  expect(result).toContain(en.contactInfo.linkedin);
  expect(result).toContain(en.contactInfo.github);
});
