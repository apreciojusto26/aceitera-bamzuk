import { describe, expect, it, vi } from 'vitest';
import { onRequest } from '@/middleware';

const blockedPaths = [
  '/api/checkout/session',
  '/api/checkout/status',
  '/api/sumup/webhook',
] as const;

function contextFor(path: string) {
  const url = new URL(path, 'https://catalog.test');
  return { url, request: new Request(url) } as Parameters<typeof onRequest>[0];
}

describe('catalog-mode server boundary', () => {
  it.each(blockedPaths)('blocks %s without resolving its endpoint', async (path) => {
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

  it.each(blockedPaths)('also blocks the trailing-slash form of %s', async (path) => {
    const next = vi.fn(async () => new Response('endpoint executed'));

    const response = await onRequest(contextFor(`${path}/`), next);

    if (!(response instanceof Response)) throw new Error('middleware returned no response');
    expect(response.status).toBe(503);
    expect(next).not.toHaveBeenCalled();
  });

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
