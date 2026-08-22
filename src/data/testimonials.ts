import normalizedProduct from '../../product.json';
import type { Stars, Testimonial } from '@/types/content';

const MONTHS: Record<string, string> = {
  ENE: '01',
  FEB: '02',
  MAR: '03',
  ABR: '04',
  MAY: '05',
  JUN: '06',
  JUL: '07',
  AGO: '08',
  SEP: '09',
  OCT: '10',
  NOV: '11',
  DIC: '12',
};

function toIsoDate(dateRaw: string): string {
  const match = /^(\d{2})\s+([A-Z]{3})\s+(\d{4})$/.exec(dateRaw.trim().toUpperCase());
  const month = match?.[2] ? MONTHS[match[2]] : undefined;
  if (!match || !month) {
    throw new Error(`Unsupported source review date: "${dateRaw}"`);
  }
  return `${match[3]}-${month}-${match[1]}`;
}

/**
 * Direct, deterministic projection of this product's normalized reviews.
 * The source provides no location or verification signal, so neither is
 * inferred. `variant` below is only the local presentation slot.
 */
export const testimonials: Testimonial[] = normalizedProduct.socialProof.reviews.map((review, index) => {
  if (!Number.isInteger(review.rating) || review.rating < 1 || review.rating > 5) {
    throw new Error(`Unsupported source review rating at index ${index}: ${review.rating}`);
  }

  return {
    id: `source-review-${index + 1}`,
    author: review.author,
    location: '',
    rating: review.rating as Stars,
    date: toIsoDate(review.dateRaw),
    title: '',
    body: review.text,
    verified: false,
    variant: index === 0 ? 'quote' : 'reel',
  };
});
