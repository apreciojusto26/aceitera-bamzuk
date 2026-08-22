import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const pageSource = readFileSync(resolve(process.cwd(), 'src/pages/index.astro'), 'utf8');
const confirmedOrder = [
  'UtilityBar',
  'SiteHeader',
  'Hero',
  'BuyBox',
  'HowItWorks',
  'ResultsGallery',
  'FeaturedTestimonial',
  'ReviewsReel',
  'Guarantee',
  'Faq',
  'SiteFooter',
] as const;

function renderedPosition(component: (typeof confirmedOrder)[number]): number {
  return pageSource.indexOf(`<${component} />`);
}

describe('catalog landing structure', () => {
  it('renders every confirmed section', () => {
    for (const component of confirmedOrder) {
      expect(renderedPosition(component), `${component} must be rendered`).toBeGreaterThan(-1);
    }
  });

  it('keeps the product sections in the confirmed order', () => {
    const positions = confirmedOrder.map(renderedPosition);
    expect(positions).toEqual([...positions].sort((left, right) => left - right));
  });

  it('restores the existing cart shell only behind verified commerce', () => {
    expect(pageSource).toContain('getProductCommerce');
    expect(pageSource).toContain('CartDrawer');
    expect(pageSource).toContain('StickyBar');
    expect(pageSource).toContain('const commerceEnabled = product.commerce.shopifyHandle.trim().length > 0');
    expect(pageSource).toContain('commerceEnabled ? await getProductCommerce() : null');
    expect(pageSource).toContain('{commerce && <StickyBar />}');
    expect(pageSource).toContain('{commerce && <CartDrawer client:load commerce={commerce} />}');
  });
});
