import type { ImageMetadata } from 'astro';

type ImageGlob = Record<string, () => Promise<{ default: ImageMetadata }>>;

export function getGlobImage(images: ImageGlob, key: string): Promise<{ default: ImageMetadata }> {
  const loader = images[key];
  if (!loader) {
    throw new Error(`Missing image: ${key}. Available: ${Object.keys(images).join(', ')}`);
  }
  return loader();
}
