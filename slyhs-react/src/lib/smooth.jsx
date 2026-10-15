import { createContext, useCallback, useContext, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import { gsap, ScrollTrigger, prefersReducedMotion } from './gsap';

const HEADER_OFFSET = -96;
/** The page transition fades the old page out for this long before the new one is shown (ms). */
const PAGE_SWAP_MS = 260;
const SmoothContext = createContext({ scrollTo: () => {}, lenis: { current: null } });

/** Lenis smooth scrolling, driven by GSAP's ticker so ScrollTrigger stays in sync. */
export function SmoothScrollProvider({ children }) {
  const lenisRef = useRef(null);
  const location = useLocation();
  const prevPath = useRef(location.pathname);

  useEffect(() => {
    if (prefersReducedMotion) return undefined;
    const lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    lenisRef.current = lenis;
    if (import.meta.env.DEV) window.__lenis = lenis; // handy for manual testing
    lenis.on('scroll', ScrollTrigger.update);
    const tick = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  const scrollTo = useCallback((target, opts = {}) => {
    const el = typeof target === 'string' ? (target === '#top' ? 0 : document.querySelector(target)) : target;
    if (el === null || el === undefined) return;
    const lenis = lenisRef.current;
    if (lenis) {
      lenis.scrollTo(el, { offset: el === 0 ? 0 : HEADER_OFFSET, duration: 1.4, ...opts });
    } else {
      const top = el === 0 ? 0 : el.getBoundingClientRect().top + window.scrollY + HEADER_OFFSET;
      window.scrollTo({ top, behavior: prefersReducedMotion || opts.immediate ? 'auto' : 'smooth' });
    }
  }, []);

  // route changes: jump to top, or to the #hash once the new page has laid out
  useEffect(() => {
    const pageChange = prevPath.current !== location.pathname;
    prevPath.current = location.pathname;
    const delay = pageChange && !prefersReducedMotion ? PAGE_SWAP_MS : 60;
    const id = setTimeout(() => {
      ScrollTrigger.refresh();
      if (location.hash) scrollTo(location.hash);
      else scrollTo(0, { immediate: true });
    }, delay);
    return () => clearTimeout(id);
  }, [location.pathname, location.hash, scrollTo]);

  return <SmoothContext.Provider value={{ scrollTo, lenis: lenisRef }}>{children}</SmoothContext.Provider>;
}

export const useSmooth = () => useContext(SmoothContext);
