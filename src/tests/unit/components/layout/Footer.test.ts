import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { expect, test } from 'vitest';
import Footer from '@components/layout/Footer.astro';
import { en } from '@i18n/translations/en';

test('Footer renders correctly', async () => {
  const container = await AstroContainer.create();
  const result = await container.renderToString(Footer);

  expect(result).toContain(en.layoutFooter.followUs);
  expect(result).toContain(en.layoutFooter.company);
  expect(result).toContain(en.layoutFooter.regulatory);

  expect(result).toContain(en.layoutFooter.links.home);
  expect(result).toContain(en.layoutFooter.links.about);
  expect(result).toContain(en.layoutFooter.links.pricing);
  expect(result).toContain(en.layoutFooter.links.contact);
  expect(result).toContain(en.layoutFooter.links.legal);
  expect(result).toContain(en.layoutFooter.links.privacy);
  expect(result).toContain(en.layoutFooter.links.styleguide);
});
