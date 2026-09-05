import type { ImageMetadata } from 'astro';
import gallery01 from '@/assets/product/gallery-01.webp';
import gallery02 from '@/assets/product/gallery-02.webp';
import gallery03 from '@/assets/product/gallery-03.webp';
import gallery04 from '@/assets/product/gallery-04.webp';
import gallery05 from '@/assets/product/gallery-05.webp';
import hero1 from '@/assets/product/hero/1.png';
import hero2 from '@/assets/product/hero/2.png';
import hero3 from '@/assets/product/hero/3.png';
import hero4 from '@/assets/product/hero/4.png';
import hero5 from '@/assets/product/hero/5.png';
import hero6 from '@/assets/product/hero/6.png';
import step01 from '@/assets/product/step-01.webp';
import ugc01 from '@/assets/product/ugc-01.webp';
import ugc02 from '@/assets/product/ugc-02.webp';
import strip01 from '@/assets/product/strip-01.webp';
import strip02 from '@/assets/product/strip-02.webp';
import strip03 from '@/assets/product/strip-03.webp';

/** Asset key to verified, product-specific image. */
export const images: Record<string, ImageMetadata> = {
  'hero-01': hero1,
  'hero-02': hero2,
  'hero-03': hero3,
  'hero-04': hero4,
  'hero-05': hero5,
  'hero-06': hero6,
  'gallery-01': gallery01,
  'gallery-02': gallery02,
  'gallery-03': gallery03,
  'gallery-04': gallery04,
  'gallery-05': gallery05,
  'step-01': step01,
  'ugc-01': ugc01,
  'ugc-02': ugc02,
  'strip-01': strip01,
  'strip-02': strip02,
  'strip-03': strip03,
};
