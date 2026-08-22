import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const PRODUCT_ID_RE = /^prd_[0-9a-z]{6,12}-[0-9a-f]{8}$/;

interface RawProduct {
  productId: string;
  sourceUrl: string;
  scrapedAt: string;
  rating: number;
  reviewCount: number;
  variants: unknown[];
  reviews: unknown[];
  images: string[];
  localImages: string[];
}

interface NormalizedProduct {
  identity: { productId: string; sourceUrl: string; sourceItemId: null; name: string; brand: string };
  commerceFacts: { variantOptions: unknown[] };
  socialProof: { rating: number; reviewCount: number; reviews: unknown[] };
  media: { images: { url: string; localPath: string; order: number }[]; videos: [] };
  specifications: [];
  description: { raw: string };
  provenance: { scrapedAt: string; scrapeJobId: null };
}

interface GenerationManifest {
  productId: string;
  sourceUrl: string;
  timestamps: { scrapedAt: string };
  assets: { src: string; dest: string; bytes: number; sha256: string }[];
}

const readJson = <T>(path: string): T =>
  JSON.parse(readFileSync(resolve(process.cwd(), path), 'utf8')) as T;

const raw = readJson<RawProduct>('output/product.json');
const run = readJson<{ productId: string; sourceUrl: string; images: string[] }>('output/.scrape-run.json');
const product = readJson<NormalizedProduct>('product.json');
const generation = readJson<GenerationManifest>('.generation.json');

describe('current scrape identity and normalized provenance', () => {
  it('propagates the real productId through every artifact', () => {
    expect(raw.productId).toMatch(PRODUCT_ID_RE);
    expect(raw.productId).toBe('prd_mt1ihbl2-bfc99f1a');
    expect(run.productId).toBe(raw.productId);
    expect(product.identity.productId).toBe(raw.productId);
    expect(generation.productId).toBe(raw.productId);
    expect(product.identity.sourceUrl).toBe(raw.sourceUrl);
    expect(generation.sourceUrl).toBe(raw.sourceUrl);
    expect(product.provenance.scrapedAt).toBe(raw.scrapedAt);
    expect(generation.timestamps.scrapedAt).toBe(raw.scrapedAt);
  });

  it('preserves every fact represented by the deterministic normalizer', () => {
    expect(product.socialProof).toMatchObject({
      rating: raw.rating,
      reviewCount: raw.reviewCount,
    });
    expect(product.socialProof.reviews).toHaveLength(30);
    expect(product.commerceFacts.variantOptions).toHaveLength(raw.variants.length);
    expect(product.media.images).toHaveLength(raw.images.length);
    expect(product.media.videos).toEqual([]);
    expect(product.specifications).toEqual([]);
    expect(product.identity.sourceItemId).toBeNull();
    expect(product.provenance.scrapeJobId).toBeNull();
  });

  it('maps all 8 fresh scrape images to active assets with matching SHA-256', () => {
    expect(run.images).toHaveLength(8);
    expect(generation.assets).toHaveLength(8);

    generation.assets.forEach((asset, index) => {
      const source = readFileSync(resolve(process.cwd(), asset.src));
      const active = readFileSync(resolve(process.cwd(), asset.dest));
      const sourceDigest = createHash('sha256').update(source).digest('hex');
      const activeDigest = createHash('sha256').update(active).digest('hex');

      expect(asset.src).toBe(`output/images/img_${index}.webp`);
      expect(sourceDigest, asset.src).toBe(asset.sha256);
      expect(activeDigest, asset.dest).toBe(asset.sha256);
      expect(active.byteLength).toBe(asset.bytes);
      expect(product.media.images[index]?.localPath).toBe(asset.src);
    });
  });
});
