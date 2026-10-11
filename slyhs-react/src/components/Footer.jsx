import { useState } from 'react';
import { useLang } from '../lib/i18n';
import { gsap, prefersReducedMotion } from '../lib/gsap';
import SmartLink from './SmartLink';
import { subscribeNewsletter } from '../lib/api';

export function Footer() {
  const { t } = useLang();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    const clean = email.trim();
    if (!clean || sending) return;
    setSending(true);
    setFailed(false);
    try {
      await subscribeNewsletter(clean);
      setSubscribed(true);
      if (!prefersReducedMotion) requestAnimationFrame(() => gsap.from('.nl-status', { y: 10, opacity: 0, duration: .6, ease: 'expo.out' }));
    } catch (err) {
      setFailed(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <footer id="contact" className="site-footer">
      <div className="container stack-48">
        <div className="footer-grid">
          <div className="footer-col">
            <span className="brand-short footer-brand">SLYHS</span>
            <p>Sri Lankan Young Herpetologists' Society. Study, protect and share Sri Lanka's reptiles and amphibians.</p>
            <a href="mailto:hello@example.lk">hello@example.lk</a>
          </div>
          <div className="footer-col">
            <span className="footer-title">{t.newsTitle}</span>
            {!subscribed ? (
              <form className="newsletter" onSubmit={onSubmit}>
                <label htmlFor="nl">Email address</label>
                <div className="nl-field glass">
                  <input id="nl" type="email" required placeholder="you@example.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  <button type="submit" disabled={sending}>{t.subscribe}</button>
                </div>
                {failed && <span className="nl-error" role="alert">Couldn't subscribe just now. Check your connection and try again.</span>}
              </form>
            ) : (
              <span role="status" className="nl-status">{t.subscribed}{email}</span>
            )}
          </div>
          <div className="footer-col footer-links">
            <span className="footer-title">Explore</span>
            <SmartLink to="/#top">About</SmartLink>
            <SmartLink to="/#what">Learn</SmartLink>
            <SmartLink to="/#path">Research</SmartLink>
            <SmartLink to="/#why">Conserve &amp; rescue</SmartLink>
            <SmartLink to="/join">Join</SmartLink>
          </div>
          <div className="footer-col footer-links">
            <span className="footer-title">Policies</span>
            <a href="#">Privacy Policy</a><a href="#">Code of Ethics</a><a href="#">Child Safeguarding</a>
            <div className="socials"><a href="#">Facebook</a><a href="#">Instagram</a><a href="#">YouTube</a><a href="#">WhatsApp</a></div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>All wildlife photos are used with credit and consent. We do not share locations of rare species.</span>
          <span>Hero image: illustrative, credit to be supplied.</span>
        </div>
      </div>
    </footer>
  );
}

export function SlimFooter() {
  const { t } = useLang();
  return (
    <footer className="site-footer site-footer-slim">
      <div className="container footer-bottom">
        <span>All wildlife photos are used with credit and consent. We do not share locations of rare species.</span>
        <span className="footer-links-inline">
          <SmartLink to="/">{t.home}</SmartLink><a href="#">Privacy Policy</a><a href="#">Code of Ethics</a><a href="#">Child Safeguarding</a>
        </span>
      </div>
    </footer>
  );
}
