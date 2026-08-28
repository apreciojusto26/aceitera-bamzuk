import type { PackProjection, VariantOption } from '@/lib/shopify/types';
import type { PricePack } from '@/types/content';

/**
 * The ONLY place a pre-cart price is computed. Pure, shared by both islands
 * via use-selection.ts so BundleSelector and StickyAddToCart can never disagree.
 * Superseded by cart.cost once a real cart exists.
 */
export function projectPack(v: VariantOption, pack: PricePack, offerActive: boolean): PackProjection {
  const totalUnits = pack.units + pack.freeUnits;
  const claimsFreeUnits = offerActive && pack.freeUnits > 0;
  const paidUnits = claimsFreeUnits ? pack.units : totalUnits; // honest when BXGY is off
  const discountPercent = pack.discountPercent ?? 0;
  if (discountPercent < 0 || discountPercent > 100) {
    throw new RangeError(`Pack discountPercent must be between 0 and 100; received ${discountPercent}`);
  }

  const basePriceCents = v.unitPriceCents * paidUnits;
  // Shopify allocates an automatic percentage discount PER UNIT and truncates
  // that allocation to the cent before multiplying by quantity — it does not
  // scale the line total. Measured 2026-08-28 against the live Storefront cart:
  // 13,50 x 5% = 0,675 -> 0,67/unit -> 27,00 - 1,34 = 25,66 (not 25,65).
  // Mirroring it here keeps the projection byte-equal to the authoritative cart,
  // which is what stops packDiscountBadge from suppressing the badge on sync.
  const unitDiscountCents = Math.floor((v.unitPriceCents * discountPercent) / 100);
  // BXGY wins when active: applying both would silently stack two promotions.
  const priceCents = claimsFreeUnits
    ? basePriceCents
    : basePriceCents - unitDiscountCents * paidUnits;
  const compareAtCents = (v.unitCompareAtCents ?? v.unitPriceCents) * totalUnits;

  return {
    packId: pack.id,
    totalUnits,
    paidUnits,
    priceCents,
    compareAtCents,
    savingsCents: Math.max(0, compareAtCents - priceCents),
    claimsFreeUnits,
  };
}

/**
 * Badge copy derives from the same configuration that changes price. Once an
 * authoritative cart exists, suppress the claim unless Shopify confirms the
 * exact projected total.
 */
export function packDiscountBadge(
  pack: PricePack,
  projection: PackProjection,
  authoritativeTotalCents: number | null,
): string | null {
  if (!pack.discountPercent) return null;
  if (authoritativeTotalCents !== null && authoritativeTotalCents !== projection.priceCents) return null;
  return `${pack.discountPercent}% de descuento`;
}

/** Suppresses "gratis" pack copy until BXGY is verified live in Shopify admin (design decision #9). */
export function packDisplayLabel(pack: PricePack, projection: PackProjection): string {
  if (projection.claimsFreeUnits) return pack.label;
  return `${projection.totalUnits} ${projection.totalUnits === 1 ? 'unidad' : 'unidades'}`;
}
