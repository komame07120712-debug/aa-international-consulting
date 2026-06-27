import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { expect, test } from 'vitest';
import ContactForm from '@components/contact/ContactForm.astro';
import { en } from '@i18n/translations/en';

test('ContactForm renders correctly', async () => {
  const container = await AstroContainer.create();
  const result = await container.renderToString(ContactForm);

  expect(result).toContain(en.contactForm.description);
  expect(result).toContain(en.contactForm.form.name);
  expect(result).toContain(en.contactForm.form.email);
  expect(result).toContain(en.contactForm.form.message);
  expect(result).toContain(en.contactForm.form.submit);
});
