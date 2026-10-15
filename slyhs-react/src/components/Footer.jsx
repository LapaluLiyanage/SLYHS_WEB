import { useId, useState } from 'react';
import { useLang } from '../lib/i18n';
import { gsap, prefersReducedMotion } from '../lib/gsap';
import SmartLink from './SmartLink';
import { subscribeNewsletter } from '../lib/api';
import { useSiteSettings, safeUrl, safeEmail } from '../lib/settings';

/** Email signup, saved to the database. Used in the footer and on the blog's coming-soon page. */
export function NewsletterForm() {
  const { t } = useLang();
  const id = useId();
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

  if (subscribed) return <span role="status" className="nl-status">{t.subscribed}{email}</span>;
  return (
    <form className="newsletter" onSubmit={onSubmit}>
      <label htmlFor={id}>Email address</label>
      <div className="nl-field glass">
        <input id={id} type="email" required placeholder="you@example.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button type="submit" disabled={sending}>{t.subscribe}</button>
      </div>
      {failed && <span className="nl-error" role="alert">Couldn't subscribe just now. Check your connection and try again.</span>}
    </form>
  );
}

export function Footer() {
  const { t } = useLang();
  const site = useSiteSettings();
  const socials = [['Facebook', site.facebook_url], ['Instagram', site.instagram_url], ['YouTube', site.youtube_url], ['WhatsApp', site.whatsapp_url]].filter(([, u]) => safeUrl(u));
  const contact = safeEmail(site.contact_email);
  const proposerEmail = safeEmail(site.proposer_email);
  return (
    <footer id="contact" className="site-footer">
      <div className="container stack-48">
        <div className="footer-grid">
          <div className="footer-col">
            <span className="brand-short footer-brand">SLYHS</span>
            <p>Sri Lankan Young Herpetologists' Society. Study, protect and share Sri Lanka's reptiles and amphibians.</p>
            {contact && <a href={'mailto:' + contact}>{contact}</a>}
            {(site.proposer_name || proposerEmail) && (
              <p className="footer-proposer">Proposer of the society: <strong>{site.proposer_name}</strong>{proposerEmail && <><br /><a href={'mailto:' + proposerEmail}>{proposerEmail}</a></>}</p>
            )}
          </div>
          <div className="footer-col">
            <span className="footer-title">{t.newsTitle}</span>
            <NewsletterForm />
          </div>
          <div className="footer-col footer-links">
            <span className="footer-title">Explore</span>
            <SmartLink to="/#top">About</SmartLink>
            <SmartLink to="/learn">Learn</SmartLink>
            <SmartLink to="/#path">Research</SmartLink>
            <SmartLink to="/#why">Conserve &amp; rescue</SmartLink>
            <SmartLink to="/blog">Blog</SmartLink>
            <SmartLink to="/join">Join</SmartLink>
          </div>
          <div className="footer-col footer-links">
            <span className="footer-title">Policies</span>
            <SmartLink to="/privacy">Privacy Policy</SmartLink><SmartLink to="/ethics">Code of Ethics</SmartLink><SmartLink to="/safeguarding">Child Safeguarding</SmartLink>
            {socials.length > 0 && <div className="socials">{socials.map(([n, u]) => <a key={n} href={safeUrl(u)} target="_blank" rel="noopener noreferrer">{n}</a>)}</div>}
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
          <SmartLink to="/">{t.home}</SmartLink><SmartLink to="/privacy">Privacy Policy</SmartLink><SmartLink to="/ethics">Code of Ethics</SmartLink><SmartLink to="/safeguarding">Child Safeguarding</SmartLink>
        </span>
      </div>
    </footer>
  );
}
