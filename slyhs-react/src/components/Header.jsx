import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useLang } from '../lib/i18n';
import { useSmooth } from '../lib/smooth';
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from '../lib/gsap';
import SmartLink from './SmartLink';

const NAV_TARGETS = ['/#top', '/learn', '/#path', '/#why', '/#events', '/blog', '/#contact'];
const LANGS = [['si', 'සිං'], ['ta', 'தமிழ்'], ['en', 'EN']];

export default function Header() {
  const { t, lang, setLang } = useLang();
  const { lenis } = useSmooth();
  const location = useLocation();
  const onJoin = location.pathname.startsWith('/join');
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef(null);
  const menuRef = useRef(null);
  const menuOpenRef = useRef(false);
  menuOpenRef.current = menuOpen;

  // header tint once you leave the top
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // close menu on route change / wide screens / Escape
  useEffect(() => { setMenuOpen(false); }, [location.pathname, location.hash]);
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 1080) setMenuOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('resize', onResize);
    document.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('resize', onResize); document.removeEventListener('keydown', onKey); };
  }, []);

  useEffect(() => {
    const l = lenis.current;
    if (l) { if (menuOpen) l.stop(); else l.start(); }
    if (menuOpen && !prefersReducedMotion && menuRef.current) {
      gsap.fromTo(menuRef.current, { opacity: 0 }, { opacity: 1, duration: .35, ease: 'power2.out' });
      gsap.fromTo(menuRef.current.children, { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: .6, ease: 'expo.out', stagger: .05 });
    }
  }, [menuOpen, lenis]);

  // hide while scrolling down, reveal when scrolling up
  useGSAP(() => {
    if (prefersReducedMotion) return;
    let hidden = false;
    ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate(self) {
        const shouldHide = self.direction === 1 && self.scroll() > 320 && !menuOpenRef.current;
        if (shouldHide !== hidden) {
          hidden = shouldHide;
          gsap.to(headerRef.current, { yPercent: shouldHide ? -170 : 0, duration: .6, ease: 'expo.out' });
        }
      }
    });
  }, { scope: headerRef });

  const cta = onJoin
    ? { to: '#register', label: t.startReg, arrow: '↓' }
    : { to: '/join', label: t.join, arrow: '→' };

  return (
    <>
      <header ref={headerRef} className={'site-header glass' + (scrolled ? ' is-scrolled' : '')} id="siteHeader">
        <SmartLink to="/#top" className="brand">
          <span className="brand-mark">SL</span>
          <span className="brand-short">SLYHS</span>
        </SmartLink>
        <nav aria-label="Main" className="main-nav">
          {t.nav.map((label, i) => <SmartLink key={i} to={NAV_TARGETS[i]}>{label}</SmartLink>)}
        </nav>
        <div className="header-actions">
          <div className="lang-switch" role="group" aria-label="Language">
            {LANGS.map(([k, label]) => (
              <button key={k} type="button" aria-pressed={lang === k} onClick={() => setLang(k)}>{label}</button>
            ))}
          </div>
          <SmartLink to={cta.to} className="btn btn-primary btn-sm hide-narrow magnetic">
            <span>{cta.label}</span> <span aria-hidden="true">{cta.arrow}</span>
          </SmartLink>
          <button type="button" className="menu-toggle" aria-label="Menu" aria-expanded={menuOpen} aria-controls="mobileMenu" onClick={() => setMenuOpen((o) => !o)}>
            <span /><span />
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="mobile-menu" id="mobileMenu" ref={menuRef}>
          {t.nav.map((label, i) => <SmartLink key={i} to={NAV_TARGETS[i]} onClick={() => setMenuOpen(false)}>{label}</SmartLink>)}
          <SmartLink to={cta.to} className="btn btn-primary" onClick={() => setMenuOpen(false)}>{cta.label} {cta.arrow}</SmartLink>
        </div>
      )}
    </>
  );
}
