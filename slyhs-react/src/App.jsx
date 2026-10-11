import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { LangProvider } from './lib/i18n';
import { SmoothScrollProvider } from './lib/smooth';
import { prefersReducedMotion } from './lib/gsap';
import Header from './components/Header';
import ScrollProgress from './components/ScrollProgress';
import Home from './pages/Home';
import Join from './pages/Join';

const SerpentScene = lazy(() => import('./three/SerpentScene'));

const TITLES = {
  '/': "SLYHS · Sri Lankan Young Herpetologists' Society",
  '/join': "Join SLYHS · Sri Lankan Young Herpetologists' Society"
};

function PageTitle() {
  const { pathname } = useLocation();
  useEffect(() => { document.title = TITLES[pathname] || TITLES['/']; }, [pathname]);
  return null;
}

export default function App() {
  return (
    <LangProvider>
      <SmoothScrollProvider>
        {!prefersReducedMotion && (
          <Suspense fallback={null}>
            <SerpentScene />
          </Suspense>
        )}
        <PageTitle />
        <ScrollProgress />
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/join" element={<Join />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </SmoothScrollProvider>
    </LangProvider>
  );
}
