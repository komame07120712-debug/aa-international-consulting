import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { expect, test } from 'vitest';
import Mission from '@components/about/Mission.astro';
import { en } from '@i18n/translations/en';

test('Mission renders correctly', async () => {
  const container = await AstroContainer.create();
  const result = await container.renderToString(Mission);

  expect(result).toContain(en.aboutMission.title);
  for (const stat of en.aboutMission.stats) {
    expect(result).toContain(stat.name);
    expect(result).toContain(stat.value);
  }
});
