import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const heroSource = readFileSync(resolve(process.cwd(), 'src/components/sections/03-hero.astro'), 'utf8');
const pageSource = readFileSync(resolve(process.cwd(), 'src/pages/index.astro'), 'utf8');
const buyBoxSource = readFileSync(resolve(process.cwd(), 'src/components/sections/05-buy-box.astro'), 'utf8');
const productSource = readFileSync(resolve(process.cwd(), 'src/data/product.ts'), 'utf8');
const imageSource = readFileSync(resolve(process.cwd(), 'src/data/images.ts'), 'utf8');

describe('product hero', () => {
  it('uses the AstraVibe single-column composition', () => {
    expect(heroSource).toContain('<section class="min-w-0 bg-white pb-6 pt-0">');
    expect(heroSource).toContain('class="-mx-5 md:mx-auto md:max-w-[42rem] xl:max-w-[40rem]"');
    expect(heroSource).toContain('class="mt-5 px-5 text-center md:px-0"');
    expect(heroSource).not.toContain('lg:grid-cols-[53fr_47fr]');
    expect(heroSource).not.toContain('shadow-[0_0_0_1px');
  });

  it('places product information and pricing beside the hero on extra-large screens', () => {
    expect(pageSource).toContain('xl:grid-cols-[minmax(0,1.1fr)_minmax(25rem,0.9fr)]');
    expect(pageSource).toMatch(/<Hero\s*\/>\s*<BuyBox\s*\/>/);
    expect(buyBoxSource).toContain("import Stars from '@/components/ui/Stars.astro';");
    expect(buyBoxSource).toContain("import PaymentLogos from '@/components/ui/PaymentLogos.astro';");
    expect(buyBoxSource).toContain('<h2 class="text-display">{commerce.title}</h2>');
    expect(buyBoxSource).toContain('<PaymentLogos />');
  });

  it('uses the six supplied hero images', () => {
    for (const imageNumber of [1, 2, 3, 4, 5, 6]) {
      expect(imageSource).toContain(`import hero${imageNumber} from '@/assets/product/hero/${imageNumber}.png';`);
      expect(productSource).toContain(`asset: 'hero-${String(imageNumber).padStart(2, '0')}'`);
    }
  });
});
