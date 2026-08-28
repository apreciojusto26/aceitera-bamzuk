import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const baselineHashes = {
  'src/pages/api/checkout/session.ts': '3e580372650b0ea82f25b6c614e6d79e0f01dfb1c848493df3bf07a3b8b65d8f',
  'src/pages/api/checkout/status.ts': '0aea83a78e9428b6c71a96bc9cf196d49e2483b77bb19aba43f14a23f9aa91d3',
  'src/pages/api/sumup/webhook.ts': 'fad0571031ab0ef49b2d50e5a779fa90c04ed5c69def08465c9089802f0dc18c',
  'src/lib/checkout/validation.ts': '0812c7b5cb8fe3cd1a00bc28d0d82a6c4aab872b603acd171b290dbf2a71cb68',
  'src/lib/kv.ts': '73e5b4f3cac7e6772560c9636af86c6ee1294b2e197e7216d7b355ab07838ca4',
  'src/lib/sumup/checkout.ts': 'c9824b0062c853f1c204ffb4433ca45f18a39ac1cc47e30de419348b2300c546',
  'src/lib/sumup/client.ts': 'c82bae224fec7021c11e75e9a420bfcc7ef4de4e2f7a5f72182acfa9544d862b',
  'src/lib/sumup/settle.ts': 'd2f12f41ba61e00dbd9b902df187d863582270e2cda78ef0f7d48ec7a0c3df06',
  'src/lib/sumup/types.ts': '05f289fba61b3c7267b0922f867008ce4b6b07219545022a1597853c9ea4afe5',
  'src/lib/shopify/admin-queries.ts': '6198e7a09d935989e1701875bc016d49e8308277306d6abd1534c944a8c4d574',
  'src/lib/shopify/admin.ts': 'b2ab4f96f3c0d7de84335eb408e6bff02e78e2f5ec7363eb1d38004630d3c4fe',
  'src/lib/shopify/cart.ts': '80d9d96121a5b9ef939255707c73e638ba2094f18e98b59975b1ac2c2097369c',
  'src/lib/shopify/client.ts': '8d0d6b3e89d67bc2b69e390e24ce7e5a818196196b5d059be78c354d87e02d9d',
  'src/lib/shopify/money.ts': 'ef6a9b8a199d0d422fa3772ffa61f1a83bd348309ba4596fa00f3aea85da0c01',
  // Baseline actualizado deliberadamente al portar `discountPercent` +
  // `packDiscountBadge` desde drop-one-product. Cualquier otra deriva en este
  // archivo sigue siendo un fallo.
  'src/lib/shopify/pricing.ts': 'b66e56491b60c497c591f86de5eb9decaefeef41282c821096a3f9eea201d518',
  'src/lib/shopify/queries.ts': 'c64ae09c136f6e4e09e3a6e01faa9ec046e3ef7d18bfc64ef4fe468d8447e0e5',
  'src/lib/shopify/types.ts': 'aa28114de6d89b84a9628afa27cabf83afb1a53dac262b5d74ba85c87aa5ed12',
} as const;

function sha256(path: string): string {
  return createHash('sha256')
    .update(readFileSync(resolve(process.cwd(), path)))
    .digest('hex');
}

describe('protected commerce infrastructure', () => {
  it.each(Object.entries(baselineHashes))('%s remains byte-identical to the baseline', (path, expected) => {
    expect(sha256(path)).toBe(expected);
  });

  it('keeps catalog.ts as the sole deliberate protected-code exception', () => {
    const catalog = readFileSync(resolve(process.cwd(), 'src/lib/shopify/catalog.ts'), 'utf8');
    const previousHandle = ['usb', 'mini', 'gal' + 'axy', 'star', 'pro' + 'jector'].join('-');
    expect(catalog).toContain('productContent.commerce.shopifyHandle.trim()');
    expect(catalog).toContain('Shopify catalog disabled: no verified product handle is configured');
    expect(catalog).not.toContain(previousHandle);
  });
});
