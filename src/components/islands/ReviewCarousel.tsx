import { useEffect, useRef } from 'react';
import { Stars } from '@/components/islands/parts/Stars';
import type { Testimonial } from '@/types/content';

interface ReviewCarouselProps {
  reviews: Testimonial[];
}

const GAP_PX = 20;
const SPEED_PX_PER_SECOND = 28;

export function ReviewCarousel({ reviews }: ReviewCarouselProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || reviews.length === 0) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let paused = false;
    let loopWidth = 0;
    let raf = 0;
    let last = performance.now();

    const measure = () => {
      const copyCount = track.children.length / 2;
      let width = 0;
      for (let i = 0; i < copyCount; i += 1) {
        const card = track.children[i] as HTMLElement | undefined;
        if (!card) return;
        width += card.offsetWidth + GAP_PX;
      }
      loopWidth = width;
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (paused || document.hidden) {
        last = now;
        return;
      }
      if (loopWidth === 0) measure();
      if (loopWidth === 0) return;

      const delta = Math.min(now - last, 50);
      last = now;
      track.scrollLeft += (delta / 1000) * SPEED_PX_PER_SECOND;
      if (track.scrollLeft >= loopWidth) track.scrollLeft -= loopWidth;
    };

    const pause = () => {
      paused = true;
    };
    const resume = () => {
      paused = false;
      last = performance.now();
    };
    const invalidate = () => {
      loopWidth = 0;
    };

    track.addEventListener('mouseenter', pause);
    track.addEventListener('mouseleave', resume);
    track.addEventListener('focusin', pause);
    track.addEventListener('focusout', resume);
    track.addEventListener('touchstart', pause, { passive: true });
    track.addEventListener('touchend', resume);
    window.addEventListener('resize', invalidate);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      track.removeEventListener('mouseenter', pause);
      track.removeEventListener('mouseleave', resume);
      track.removeEventListener('focusin', pause);
      track.removeEventListener('focusout', resume);
      track.removeEventListener('touchstart', pause);
      track.removeEventListener('touchend', resume);
      window.removeEventListener('resize', invalidate);
    };
  }, [reviews.length]);

  const loop = [...reviews, ...reviews];

  return (
    <div role="region" aria-roledescription="carousel" aria-label="Reseñas de clientes">
      <div
        ref={trackRef}
        className="scrollbar-none flex gap-5 overflow-x-auto px-[max(1.25rem,calc((100vw_-_28rem)/2_+_1.25rem))] pb-8 md:px-[max(1.25rem,calc((100vw_-_42rem)/2_+_1.25rem))] lg:px-[max(1.25rem,calc((100vw_-_72rem)/2_+_1.25rem))] xl:px-[max(1.25rem,calc((100vw_-_80rem)/2_+_1.25rem))]"
      >
        {loop.map((review, i) => (
          <article
            key={`${review.id}-${i}`}
            aria-hidden={i >= reviews.length || undefined}
            className="flex w-[86%] shrink-0 flex-col rounded-card border border-graphite/5 bg-white p-5 text-left shadow-[0_2px_8px_rgba(30,33,36,0.04),0_12px_28px_rgba(30,33,36,0.06)] transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_10px_rgba(30,33,36,0.05),0_16px_34px_rgba(30,33,36,0.09)] sm:w-[48%] xl:w-[31%]"
          >
            <Stars rating={review.rating} className="mb-3" />
            <p className="flex-1 text-sm leading-relaxed text-graphite">{review.body}</p>
            <div className="mt-4">
              <p className="text-xs font-bold text-graphite">
                {review.author}
                {review.location && <span className="font-normal text-steel">{` · ${review.location}`}</span>}
              </p>
              <time dateTime={review.date} className="mt-1 block text-[0.6875rem] text-steel">
                {review.date}
              </time>
              {review.verified && (
                <span className="mt-2 inline-flex items-center justify-center gap-1 rounded-pill bg-gold-tint px-2.5 py-1 text-xs font-semibold uppercase text-amber-700">
                  <svg viewBox="0 0 20 20" className="size-3.5" aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                    />
                  </svg>
                  Compra verificada
                </span>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
