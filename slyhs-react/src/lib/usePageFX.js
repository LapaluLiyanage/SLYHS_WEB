import { useEffect } from 'react';
import { gsap, useGSAP, prefersReducedMotion, finePointer } from './gsap';

const animate = !prefersReducedMotion;

/**
 * Page-wide interaction + reveal effects inside `scope`:
 *  - glass cards: pointer-follow light (all) and 3D tilt ([data-tilt])
 *  - magnetic buttons (.magnetic)
 *  - generic scroll reveals: [data-reveal], .section-head .eyebrow, h2.split word masks
 */
export default function usePageFX(scope) {
  // pointer effects via delegation, so React re-renders never orphan listeners
  useEffect(() => {
    const root = scope.current;
    if (!root || !finePointer) return undefined;
    const tilts = new WeakMap();
    const magnets = new WeakMap();
    let activeCard = null;
    let activeMagnet = null;

    const tiltFor = (card) => {
      if (!tilts.has(card)) {
        gsap.set(card, { transformPerspective: 1000 });
        tilts.set(card, {
          rx: gsap.quickTo(card, 'rotationX', { duration: .6, ease: 'power3.out' }),
          ry: gsap.quickTo(card, 'rotationY', { duration: .6, ease: 'power3.out' })
        });
      }
      return tilts.get(card);
    };
    const magnetFor = (btn) => {
      if (!magnets.has(btn)) {
        magnets.set(btn, {
          x: gsap.quickTo(btn, 'x', { duration: .5, ease: 'power3.out' }),
          y: gsap.quickTo(btn, 'y', { duration: .5, ease: 'power3.out' })
        });
      }
      return magnets.get(btn);
    };
    const releaseCard = (card) => {
      if (card && animate && card.hasAttribute('data-tilt')) { const t = tiltFor(card); t.rx(0); t.ry(0); }
    };
    const releaseMagnet = (btn) => {
      if (btn) gsap.to(btn, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, .4)', overwrite: true });
    };

    const onMove = (e) => {
      const card = e.target.closest('.glass-card');
      if (card !== activeCard) { releaseCard(activeCard); activeCard = card; }
      if (card) {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        card.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (y * 100).toFixed(1) + '%');
        if (animate && card.hasAttribute('data-tilt')) { const t = tiltFor(card); t.rx((.5 - y) * 7); t.ry((x - .5) * 9); }
      }

      if (!animate) return;
      const btn = e.target.closest('.magnetic');
      if (btn !== activeMagnet) { releaseMagnet(activeMagnet); activeMagnet = btn; }
      if (btn) {
        const r = btn.getBoundingClientRect();
        const m = magnetFor(btn);
        m.x((e.clientX - (r.left + r.width / 2)) * .28);
        m.y((e.clientY - (r.top + r.height / 2)) * .38);
      }
    };
    const onLeave = () => { releaseCard(activeCard); activeCard = null; releaseMagnet(activeMagnet); activeMagnet = null; };

    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerleave', onLeave);
    return () => { root.removeEventListener('pointermove', onMove); root.removeEventListener('pointerleave', onLeave); };
  }, [scope]);

  useGSAP(() => {
    if (!animate) return;
    gsap.utils.toArray('[data-reveal]').forEach((el) => {
      gsap.from(el, { y: 40, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
    });
    gsap.utils.toArray('.section-head .eyebrow, .join-kicker').forEach((el) => {
      gsap.from(el, { y: 14, opacity: 0, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
    });
    gsap.utils.toArray('h2.split').forEach((h) => {
      gsap.from(h.querySelectorAll('.wi'), {
        yPercent: 120, rotationX: -70, transformOrigin: '50% 100%', transformPerspective: 600,
        duration: 1.3, ease: 'expo.out', stagger: .045,
        scrollTrigger: { trigger: h, start: 'top 85%' }
      });
    });
    gsap.from('.footer-col', { y: 40, opacity: 0, duration: 1, ease: 'expo.out', stagger: .08, scrollTrigger: { trigger: '.site-footer', start: 'top 90%' } });
  }, { scope });
}
