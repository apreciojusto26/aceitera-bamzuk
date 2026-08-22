import { describe, expect, it } from 'vitest';
import { product } from '@/data/product';
import { testimonials } from '@/data/testimonials';
import { getProductCommerce } from '@/lib/shopify/catalog';

import normalizedProduct from '../../product.json';

describe('catalog-only safety gate', () => {
  it('uses OLZURA exclusively in public data without rewriting source provenance', () => {
    expect(product.brand).toBe('OLZURA');
    expect(product.name).not.toMatch(/zomasou/i);
    expect(normalizedProduct.identity.brand).toBe('ZOMASOU');
    expect(JSON.stringify({ product, testimonials })).not.toMatch(/zomasou/i);
  });

  it('keeps commerce disabled while exposing only source-backed social proof', () => {
    expect(product.commerce.shopifyHandle).toBe('');
    expect(product.commerce.bundleOfferActive).toBe(false);
    expect(product.ratingAverage).toBe(normalizedProduct.socialProof.rating);
    expect(product.ratingCount).toBe(normalizedProduct.socialProof.reviewCount);
    expect(testimonials).toHaveLength(normalizedProduct.socialProof.reviews.length);
  });

  it('keeps the restored commerce copy ready without rendering it in catalog mode', () => {
    expect(product.cta).toMatchObject({
      primary: 'Comprar ahora',
      sticky: 'Agregar al carrito',
      checkout: 'Finalizar compra',
      soldOut: 'Agotado',
    });
  });

  it('maps every displayed review with explicit empty title/location and no invented facts', () => {
    testimonials.forEach((testimonial, index) => {
      const source = normalizedProduct.socialProof.reviews[index];

      expect(testimonial).toMatchObject({
        author: source?.author,
        rating: source?.rating,
        body: source?.text,
        verified: false,
        location: '',
        title: '',
      });
      expect(Object.hasOwn(testimonial, 'location')).toBe(true);
      expect(Object.hasOwn(testimonial, 'title')).toBe(true);
    });
  });

  it('does not advertise an unverified guarantee or return window', () => {
    expect(product.guarantee.days).toBe(0);
    expect(product.guarantee.title).not.toMatch(/\d+\s*d[ií]as?/i);
    expect(product.guarantee.text).toMatch(/condiciones|comercio/i);
  });

  it('fails before a Shopify request when no verified handle exists', async () => {
    await expect(getProductCommerce()).rejects.toThrow(
      'Shopify catalog disabled: no verified product handle is configured',
    );
  });
});
