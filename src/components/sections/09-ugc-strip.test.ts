import { statSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

const productImages = [
  'gallery-01.webp',
  'gallery-02.webp',
  'gallery-03.webp',
  'gallery-04.webp',
  'gallery-05.webp',
  'step-01.webp',
  'ugc-01.webp',
  'ugc-02.webp',
] as const;

describe('oil sprayer image inventory', () => {
  it.each(productImages)('%s is a valid square WebP owned by this product', async (file) => {
    const imagePath = resolve(process.cwd(), 'src/assets/product', file);
    const metadata = await sharp(imagePath).metadata();

    expect(statSync(imagePath).size).toBeGreaterThan(0);
    expect(metadata.format).toBe('webp');
    expect(metadata.width).toBe(1000);
    expect(metadata.height).toBe(1000);
  });
});
