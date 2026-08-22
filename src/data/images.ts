import type { ImageMetadata } from 'astro';
import gallery01 from '@/assets/product/gallery-01.webp';
import gallery02 from '@/assets/product/gallery-02.webp';
import gallery03 from '@/assets/product/gallery-03.webp';
import gallery04 from '@/assets/product/gallery-04.webp';
import gallery05 from '@/assets/product/gallery-05.webp';
import step01 from '@/assets/product/step-01.webp';
import ugc01 from '@/assets/product/ugc-01.webp';
import ugc02 from '@/assets/product/ugc-02.webp';

/** Asset key to verified, product-specific image. */
export const images: Record<string, ImageMetadata> = {
  'gallery-01': gallery01,
  'gallery-02': gallery02,
  'gallery-03': gallery03,
  'gallery-04': gallery04,
  'gallery-05': gallery05,
  'step-01': step01,
  'ugc-01': ugc01,
  'ugc-02': ugc02,
};
