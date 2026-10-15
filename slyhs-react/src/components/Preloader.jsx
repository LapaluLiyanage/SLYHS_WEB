import { useEffect, useRef, useState } from 'react';
import { gsap, prefersReducedMotion } from '../lib/gsap';

const KEY = 'slyhs-preloaded';
const MIN_MS = 1500;   // long enough to watch the snake coil, short enough not to annoy
const MAX_MS = 5000;   // never hold the site hostage if something is slow

const seen = () => { try { return sessionStorage.getItem(KEY) === '1'; } catch { return false; } };

// A snake coiling inwards: an Archimedean spiral, tail on the outside, head at the centre.
const TURNS = 2.6, R0 = 70, R1 = 9, STEPS = 140;
const POINTS = Array.from({ length: STEPS + 1 }, (_, i) => {
  const t = i / STEPS;
  const a = t * TURNS * Math.PI * 2 - Math.PI / 2;
  const r = R0 + (R1 - R0) * t;
  return [100 + r * Math.cos(a), 100 + r * Math.sin(a)];
});
const PATH = 'M' + POINTS.map(([x, y]) => x.toFixed(1) + ' ' + y.toFixed(1)).join(' L');

/** Intro shown once per visit: a snake coils up while fonts and the page finish loading. */
export default function Preloader() {
  const [done, setDone] = useState(seen);
  const root = useRef(null);
  const body = useRef(null);
  const scales = useRef(null);
  const head = useRef(null);

  useEffect(() => {
    if (done) return undefined;
    document.documentElement.classList.add('is-loading');
    const start = performance.now();
    const state = { p: 0 };
    let finished = false;

    const draw = () => {
      const i = Math.min(STEPS, Math.max(1, Math.round(state.p * STEPS)));
      const off = 1 - state.p;
      body.current.style.strokeDashoffset = off;
      scales.current.style.strokeDashoffset = off;
      const [x, y] = POINTS[i], [px, py] = POINTS[i - 1];
      const ang = Math.atan2(y - py, x - px) * 180 / Math.PI;
      head.current.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${ang.toFixed(1)})`);
      head.current.style.opacity = state.p > 0.01 ? 1 : 0;
    };
    draw();

    const coil = gsap.to(state, { p: .88, duration: MIN_MS / 1000 * 1.5, ease: 'power2.out', onUpdate: draw });

    const finish = () => {
      if (finished) return;
      finished = true;
      coil.kill();
      const tl = gsap.timeline({ onComplete: () => {
        document.documentElement.classList.remove('is-loading');
        try { sessionStorage.setItem(KEY, '1'); } catch { /* private mode */ }
        setDone(true);
      } });
      tl.to(state, { p: 1, duration: .35, ease: 'power2.out', onUpdate: draw })
        .to(root.current, { opacity: 0, duration: prefersReducedMotion ? .15 : .6, ease: 'power2.inOut' }, '+=.15');
    };

    const ready = Promise.all([
      new Promise((r) => (document.readyState === 'complete' ? r() : window.addEventListener('load', r, { once: true }))),
      document.fonts && document.fonts.ready ? document.fonts.ready.catch(() => {}) : Promise.resolve()
    ]);
    ready.then(() => setTimeout(finish, Math.max(0, MIN_MS - (performance.now() - start))));
    const cap = setTimeout(finish, MAX_MS);

    return () => { clearTimeout(cap); coil.kill(); document.documentElement.classList.remove('is-loading'); };
  }, [done]);

  if (done) return null;
  return (
    <div className="preloader" ref={root} role="status" aria-label="Loading SLYHS">
      <svg className="preloader-snake" viewBox="0 0 200 200" aria-hidden="true">
        <defs>
          <linearGradient id="pl-body" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#5BA06A" />
            <stop offset="1" stopColor="#C9EE6E" />
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r="86" className="pl-ring" />
        <path d={PATH} pathLength="1" className="pl-body" ref={body} />
        <path d={PATH} pathLength="1" className="pl-scales" ref={scales} />
        <g ref={head} className="pl-head">
          <ellipse cx="2" cy="0" rx="8.5" ry="6.2" className="pl-head-shape" />
          <circle cx="4" cy="-2.6" r="1.5" className="pl-eye" />
          <circle cx="4" cy="2.6" r="1.5" className="pl-eye" />
          <path d="M10 0 L16 0 M16 0 L19 -2.2 M16 0 L19 2.2" className="pl-tongue" />
        </g>
      </svg>
      <span className="preloader-mark">SLYHS</span>
      <span className="preloader-sub">Waking the herps…</span>
    </div>
  );
}
