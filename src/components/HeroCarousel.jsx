import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1800&q=80',
    alt: 'Skilled worker fixing a home appliance',
  },
  {
    image: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1800&q=80',
    alt: 'Professional at work on a service job',
  },
  {
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1800&q=80',
    alt: 'Local professional ready to help',
  },
];

const AUTOPLAY_MS = 5000;

export default function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);

  const goTo = useCallback((i) => {
    setIndex((i + SLIDES.length) % SLIDES.length);
  }, []);

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  useEffect(() => {
    if (paused) return undefined;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, AUTOPLAY_MS);
    return () => clearInterval(timerRef.current);
  }, [paused]);

  return (
    <div
      className="relative w-full h-[440px] sm:h-[520px] md:h-[600px] overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        className="flex h-full transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {SLIDES.map((slide, i) => (
          <div key={i} className="relative w-full h-full shrink-0">
            <img src={slide.image} alt={slide.alt} className="w-full h-full object-cover" />
          </div>
        ))}
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-ink-900/80 via-ink-900/30 to-ink-900/10" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink-900/50 via-transparent to-transparent" />

      <button
        onClick={prev}
        aria-label="Previous slide"
        className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/15 backdrop-blur border border-white/30 text-white items-center justify-center hover:bg-white/25 transition-colors"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={next}
        aria-label="Next slide"
        className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/15 backdrop-blur border border-white/30 text-white items-center justify-center hover:bg-white/25 transition-colors"
      >
        <ChevronRight size={20} />
      </button>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-1.5 rounded-pill transition-all ${
              i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/75'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
