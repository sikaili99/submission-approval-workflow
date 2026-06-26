import { useEffect } from 'react';

// Reveals elements marked with [data-reveal] as they scroll into view, and
// toggles a blurred background on the [data-nav] header once the page scrolls.
// Honors prefers-reduced-motion by showing everything immediately.
export function useScrollReveal() {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));

    if (reduce) {
      els.forEach((el) => {
        el.style.opacity = '1';
        el.style.transform = 'none';
      });
    } else {
      els.forEach((el) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        const delay = Number(el.dataset.revealDelay ?? '0');
        el.style.transition = `opacity .7s cubic-bezier(.2,0,0,1) ${delay}ms, transform .7s cubic-bezier(.2,0,0,1) ${delay}ms`;
      });
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const el = e.target as HTMLElement;
            el.style.opacity = '1';
            el.style.transform = 'none';
            io.unobserve(el);
          }
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -6% 0px' },
    );
    if (!reduce) els.forEach((el) => io.observe(el));

    const nav = document.querySelector<HTMLElement>('[data-nav]');
    const onScroll = () => {
      if (!nav) return;
      if (window.scrollY > 6) {
        nav.style.background = 'rgba(251,250,247,0.82)';
        nav.style.backdropFilter = 'saturate(180%) blur(10px)';
        nav.style.borderBottomColor = '#E8E6E0';
      } else {
        nav.style.background = 'rgba(251,250,247,0)';
        nav.style.backdropFilter = 'none';
        nav.style.borderBottomColor = 'transparent';
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, []);
}
