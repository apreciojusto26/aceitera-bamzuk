import { describe, expect, it } from 'vitest';
import { packDiscountBadge, projectPack } from '@/lib/shopify/pricing';
import type { VariantOption } from '@/lib/shopify/types';
import type { PricePack } from '@/types/content';

const variant = (unitPriceCents: number): VariantOption => ({
  id: 'gid://shopify/ProductVariant/1',
  title: 'v',
  optionValue: 'v',
  availableForSale: true,
  unitPriceCents,
  unitCompareAtCents: null,
  imageIndex: null,
});

const pack = (over: Partial<PricePack> = {}): PricePack => ({
  id: 'x2',
  units: 2,
  freeUnits: 0,
  label: '2 unidades',
  ...over,
});

describe('projectPack — percentage discount', () => {
  // Contrastado contra el carrito real de la Storefront API el 2026-08-28.
  // Shopify asigna el descuento POR UNIDAD y lo trunca al céntimo antes de
  // multiplicar por la cantidad; NO escala el total de la línea. Si esto se
  // "simplifica" a Math.round(total * 0.95) la proyección se desvía un céntimo
  // y packDiscountBadge oculta el badge en cuanto el carrito sincroniza.
  it.each([
    [1350, 2, 2566],
    [1350, 3, 3849],
    [1330, 2, 2528],
    [1330, 3, 3792],
  ])('unit %i x %i con 5%% coincide con el total autoritativo de Shopify', (unit, units, expected) => {
    expect(projectPack(variant(unit), pack({ units, discountPercent: 5 }), false).priceCents).toBe(expected);
  });

  it('deja el precio intacto cuando no hay discountPercent', () => {
    expect(projectPack(variant(1350), pack(), false).priceCents).toBe(2700);
  });

  it('no acumula BXGY y porcentaje a la vez', () => {
    const p = pack({ units: 2, freeUnits: 1, discountPercent: 5 });
    expect(projectPack(variant(1350), p, true).priceCents).toBe(2700);
  });

  it.each([-1, 101])('rechaza un discountPercent fuera de rango (%i)', (bad) => {
    expect(() => projectPack(variant(1350), pack({ discountPercent: bad }), false)).toThrow(RangeError);
  });
});

describe('packDiscountBadge', () => {
  const p = pack({ discountPercent: 5 });

  it('no anuncia nada si el pack no tiene descuento', () => {
    const plain = pack();
    expect(packDiscountBadge(plain, projectPack(variant(1350), plain, false), null)).toBeNull();
  });

  it('anuncia el porcentaje mientras no exista un carrito autoritativo', () => {
    expect(packDiscountBadge(p, projectPack(variant(1350), p, false), null)).toBe('5% de descuento');
  });

  it('se calla si Shopify cobra algo distinto a lo proyectado', () => {
    expect(packDiscountBadge(p, projectPack(variant(1350), p, false), 2700)).toBeNull();
  });

  it('se mantiene si Shopify confirma el total exacto', () => {
    expect(packDiscountBadge(p, projectPack(variant(1350), p, false), 2566)).toBe('5% de descuento');
  });
});
