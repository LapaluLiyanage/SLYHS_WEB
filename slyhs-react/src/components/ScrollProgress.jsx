import { useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { gsap, useGSAP } from '../lib/gsap';

export default function ScrollProgress() {
  const ref = useRef(null);
  const { pathname } = useLocation();

  useGSAP(() => {
    gsap.fromTo(ref.current, { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: .3 } });
  }, { dependencies: [pathname], revertOnUpdate: true });

  return <div className="progress" aria-hidden="true"><span ref={ref} /></div>;
}
