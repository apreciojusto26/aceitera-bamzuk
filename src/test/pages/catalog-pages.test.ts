import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

function filesBelow(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? filesBelow(path) : [path];
  });
}

describe('catalog-only page boundaries', () => {
  it('keeps checkout and confirmation UI conditional on verified commerce', () => {
    const checkout = source('src/pages/checkout/index.astro');
    const confirmation = source('src/pages/checkout/gracias.astro');

    expect(checkout).toContain('commerceEnabled ? await getProductCommerce() : null');
    expect(checkout).toContain('commerce ?');
    expect(checkout).toContain('<CheckoutForm client:load commerce={commerce} />');

    expect(confirmation).toContain('commerceEnabled');
    expect(confirmation).toContain('commerceEnabled ?');
    expect(confirmation).toContain('<OrderConfirmation client:load paymentRef={paymentRef} />');
  });

  it('emits social images only when Astro.site is configured', () => {
    const base = source('src/layouts/Base.astro');
    expect(base).toContain("Astro.site ? new URL('/og-cover.webp', Astro.site).toString() : null");
    expect(base).not.toContain('Astro.site ?? Astro.url');
    expect(base).not.toContain('localhost');
  });

  it('uses a main landmark and does not imply nonexistent legal pages', () => {
    expect(source('src/pages/index.astro')).toContain('<main>');
    const footer = source('src/components/sections/14-site-footer.astro');
    expect(footer).not.toContain('Términos y condiciones');
    expect(footer).not.toContain('Privacidad');
  });

  it('does not render the source manufacturer as public branding', () => {
    expect(source('src/components/sections/14-site-footer.astro')).not.toMatch(/zomasou/i);
  });

  it('keeps test modules outside Astro route discovery', () => {
    const routeFiles = filesBelow(resolve(process.cwd(), 'src/pages'));
    expect(routeFiles.filter((path) => /\.test\.tsx?$/.test(path))).toEqual([]);
  });
});
