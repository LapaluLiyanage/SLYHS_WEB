import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { LangProvider } from './lib/i18n';
import { SmoothScrollProvider } from './lib/smooth';
import { gsap, prefersReducedMotion } from './lib/gsap';
import Header from './components/Header';
import ScrollProgress from './components/ScrollProgress';
import Preloader from './components/Preloader';
import Home from './pages/Home';
import Join from './pages/Join';
import Learn from './pages/Learn';
import Blog from './pages/Blog';
import Policy from './pages/Policy';
import Contact from './pages/Contact';

const SerpentScene = lazy(() => import('./three/SerpentScene'));
const Admin = lazy(() => import('./pages/Admin'));

const TITLES = {
  '/': "SLYHS · Sri Lankan Young Herpetologists' Society",
  '/join': "Join SLYHS · Sri Lankan Young Herpetologists' Society",
  '/learn': "Learn · Sri Lanka's endemic herps · SLYHS",
  '/blog': 'Blog · SLYHS',
  '/contact': 'Contact · SLYHS',
  '/privacy': 'Privacy Policy · SLYHS',
  '/ethics': 'Code of Ethics · SLYHS',
  '/safeguarding': 'Child Safeguarding · SLYHS'
};

function PageTitle() {
  const { pathname } = useLocation();
  useEffect(() => { document.title = TITLES[pathname] || (pathname.startsWith('/blog/') ? 'Blog · SLYHS' : pathname.startsWith('/learn/') ? TITLES['/learn'] : TITLES['/']); }, [pathname]);
  return null;
}

const OUT_S = .2; // old page fades out, then the route swaps and the new page fades in

/** Small page transition: the page fades out, a thin bar runs across the top, the new page fades in. */
function AnimatedRoutes() {
  const location = useLocation();
  const [shown, setShown] = useState(location);
  const bar = useRef(null);
  const first = useRef(true);

  // 1. a different page was requested: fade the current one out, then swap
  useEffect(() => {
    if (location.pathname === shown.pathname) return undefined;
    const page = document.querySelector('main');
    if (prefersReducedMotion || !page) { setShown(location); return undefined; }
    gsap.fromTo(bar.current, { scaleX: 0, opacity: 1 }, { scaleX: .7, duration: .6, ease: 'power2.out' });
    const t = gsap.to(page, { opacity: 0, duration: OUT_S, ease: 'power1.in', onComplete: () => setShown(location) });
    return () => { t.kill(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // 2. the new page is on screen: fade it in and finish the bar
  useLayoutEffect(() => {
    if (first.current) { first.current = false; return undefined; }
    if (prefersReducedMotion) return undefined;
    const page = document.querySelector('main');
    const tl = gsap.timeline();
    if (page) tl.fromTo(page, { opacity: 0 }, { opacity: 1, duration: .45, ease: 'power2.out', clearProps: 'opacity' }, 0);
    tl.to(bar.current, { scaleX: 1, duration: .3, ease: 'power2.out' }, 0)
      .to(bar.current, { opacity: 0, duration: .25 });
    return () => { tl.kill(); if (page) gsap.set(page, { clearProps: 'opacity' }); };
  }, [shown.pathname]);

  // while the old page fades out keep rendering it; same-page hash changes apply at once
  const routeLocation = location.pathname === shown.pathname ? location : shown;

  return (
    <>
      <div className="route-bar" ref={bar} aria-hidden="true" />
      <Routes location={routeLocation}>
        <Route path="/" element={<Home />} />
        <Route path="/join" element={<Join />} />
        <Route path="/learn" element={<Learn />} />
        <Route path="/learn/:species" element={<Learn />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:post" element={<Blog />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/:slug" element={<Policy />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </>
  );
}

export default function App() {
  const { pathname } = useLocation();

  // the admin panel is its own app: no site header, 3D scene, intro or page motion
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return <Suspense fallback={null}><Admin /></Suspense>;
  }

  return (
    <LangProvider>
      <Preloader />
      <SmoothScrollProvider>
        {!prefersReducedMotion && (
          <Suspense fallback={null}>
            <SerpentScene />
          </Suspense>
        )}
        <PageTitle />
        <ScrollProgress />
        <Header />
        <AnimatedRoutes />
      </SmoothScrollProvider>
    </LangProvider>
  );
}
