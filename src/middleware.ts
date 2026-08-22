import { defineMiddleware } from 'astro:middleware';
import { product } from '@/data/product';

const COMMERCE_ENDPOINTS = new Set([
  '/api/checkout/session',
  '/api/checkout/status',
  '/api/sumup/webhook',
]);

/**
 * A missing verified Shopify handle puts this generated landing in catalog
 * mode. The middleware is the common server boundary: endpoint handlers are
 * never resolved, so Shopify, SumUp and Redis code cannot execute indirectly.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const catalogMode = product.commerce.shopifyHandle.trim().length === 0;
  const pathname = context.url.pathname.length > 1
    ? context.url.pathname.replace(/\/+$/, '')
    : context.url.pathname;

  if (catalogMode && COMMERCE_ENDPOINTS.has(pathname)) {
    return Response.json(
      {
        status: 'unavailable',
        code: 'CATALOG_MODE_COMMERCE_DISABLED',
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    );
  }

  return next();
});
