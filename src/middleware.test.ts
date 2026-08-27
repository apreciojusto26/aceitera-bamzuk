import { describe, expect, it, vi } from 'vitest';
import { onRequest } from '@/middleware';
import { product } from '@/data/product';

const commercePaths = [
  '/api/checkout/session',
  '/api/checkout/status',
  '/api/sumup/webhook',
] as const;

/**
 * The boundary is driven by the env-supplied handle (see src/data/product.ts),
 * so the suite asserts whichever side of it this environment is actually on:
 * blocked in catalog mode, forwarded once a handle is configured. Both
 * directions are real contracts — neither may silently pass by being skipped.
 */
const catalogMode = product.commerce.shopifyHandle.trim().length === 0;

function contextFor(path: string) {
  const url = new URL(path, 'https://catalog.test');
  return { url, request: new Request(url) } as Parameters<typeof onRequest>[0];
}

describe.runIf(catalogMode)('catalog-mode server boundary', () => {
  it.each(commercePaths)('blocks %s without resolving its endpoint', async (path) => {
    const next = vi.fn(async () => new Response('endpoint executed'));

    const response = await onRequest(contextFor(`${path}?probe=1`), next);

    if (!(response instanceof Response)) throw new Error('middleware returned no response');
    expect(response.status).toBe(503);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('content-type')).toContain('application/json');
    await expect(response.json()).resolves.toEqual({
      status: 'unavailable',
      code: 'CATALOG_MODE_COMMERCE_DISABLED',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it.each(commercePaths)('also blocks the trailing-slash form of %s', async (path) => {
    const next = vi.fn(async () => new Response('endpoint executed'));

    const response = await onRequest(contextFor(`${path}/`), next);

    if (!(response instanceof Response)) throw new Error('middleware returned no response');
    expect(response.status).toBe(503);
    expect(next).not.toHaveBeenCalled();
  });
});

describe.runIf(!catalogMode)('commerce-mode server boundary', () => {
  it.each(commercePaths)('forwards %s to its endpoint once a handle is configured', async (path) => {
    const expected = new Response('endpoint executed');
    const next = vi.fn(async () => expected);

    const response = await onRequest(contextFor(`${path}?probe=1`), next);

    expect(response).toBe(expected);
    expect(next).toHaveBeenCalledOnce();
  });
});

describe('routes outside the commerce boundary', () => {
  it.each(['/', '/favicon.svg', '/checkout', '/checkout/gracias', '/api/non-commerce']) (
    'allows the normal route %s to resolve',
    async (path) => {
      const expected = new Response('normal route');
      const next = vi.fn(async () => expected);

      const response = await onRequest(contextFor(path), next);

      expect(response).toBe(expected);
      expect(next).toHaveBeenCalledOnce();
    },
  );
});
