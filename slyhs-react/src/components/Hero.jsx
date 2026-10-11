import { forwardRef, lazy, Suspense, useCallback, useImperativeHandle, useRef, useState } from 'react';

const HeroScene = lazy(() => import('../three/HeroScene'));

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) {
    return false;
  }
}
const HAS_WEBGL = typeof window !== 'undefined' && webglAvailable();

/** Full-bleed hero: photo fallback + Three.js layer + scrim, with page content as children. */
const Hero = forwardRef(function Hero({ id = 'top', className = '', label, children }, ref) {
  const sectionRef = useRef(null);
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);
  useImperativeHandle(ref, () => sectionRef.current);

  return (
    <section id={id} ref={sectionRef} className={`hero ${className}${ready ? ' webgl-on' : ''}`} data-screen-label={label}>
      <div className="hero-media" aria-hidden="true">
        <img className="hero-img" src="/assets/hero-snake.jpg" alt="" />
        {HAS_WEBGL && (
          <Suspense fallback={null}>
            <HeroScene sectionRef={sectionRef} onReady={onReady} />
          </Suspense>
        )}
      </div>
      <div className="hero-scrim" aria-hidden="true" />
      {children}
    </section>
  );
});

export default Hero;
