import { describe, expect, it } from 'vitest';
import { formatVariantLabel } from '@/lib/shopify/variant-label';

describe('formatVariantLabel', () => {
  it.each([
    ['Plastic 1Pcs Black', 'Negro'],
    ['Plastic 1Pcs Yellow', 'Amarillo'],
    ['Verde', 'Verde'],
  ])('replaces the supplier label %s with %s', (supplierLabel, expected) => {
    expect(formatVariantLabel(supplierLabel)).toBe(expected);
  });
});
