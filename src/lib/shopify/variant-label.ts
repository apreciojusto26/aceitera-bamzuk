const SUPPLIER_COLOR_LABELS: Record<string, string> = {
  'plastic 1pcs black': 'Negro',
  'plastic 1pcs yellow': 'Amarillo',
};

/**
 * Replaces the supplier's technical colour wording with the label a shopper
 * expects to see. Unknown labels pass through untouched so Shopify remains
 * the source of truth when its catalogue changes.
 */
export function formatVariantLabel(label: string): string {
  const normalized = label.trim().toLocaleLowerCase('en-US');
  return SUPPLIER_COLOR_LABELS[normalized] ?? label;
}
