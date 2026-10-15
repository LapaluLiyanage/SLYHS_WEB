import { useEffect } from 'react';
import { useSmooth } from '../lib/smooth';
import { AID_STEPS, AID_NEVER, AID_SIGNS, AID_PREVENT, AID_HOME } from '../pages/speciesData';

/** Snakebite first-aid guide, shown as a dialog over the page. */
export default function AidModal({ open, onClose, onIdentify }) {
  const { lenis } = useSmooth();

  useEffect(() => {
    if (!open) return undefined;
    const L = lenis.current;
    document.documentElement.style.overflow = 'hidden';
    if (L) L.stop();
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.documentElement.style.overflow = '';
      if (L) L.start();
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, lenis]);

  if (!open) return null;

  return (
    <div className="aid-backdrop" role="dialog" aria-modal="true" aria-label="Snakebite first-aid guide" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="aid-panel" data-lenis-prevent>
        <button type="button" className="aid-close" aria-label="Close first-aid guide" onClick={onClose}>✕</button>
        <div className="aid-body">
          <div className="aid-head">
            <div className="aid-title">
              <span className="eyebrow aid-eyebrow">First-aid guide</span>
              <h2 className="h2">Snakebite: what to do <span className="serif aid-serif">in the first hour.</span></h2>
            </div>
            <div className="aid-actions">
              <a href="tel:1990" className="aid-call">Call 1990 · Suwa Seriya</a>
              <button type="button" className="btn btn-ghost aid-print" onClick={() => window.print()}>Print this guide</button>
            </div>
          </div>

          <div className="aid-grid">
            <ol className="aid-steps">
              {AID_STEPS.map(([title, text], i) => (
                <li key={title} className="aid-step">
                  <div className="aid-step-head">
                    <span className={'aid-n' + (i === 4 ? ' is-key' : '')}>{i + 1}</span>
                    <h3>{title}</h3>
                  </div>
                  <p>{text}</p>
                </li>
              ))}
            </ol>
            <div className="aid-side">
              <div className="aid-box aid-never">
                <span className="aid-label">Never do this</span>
                <ul>{AID_NEVER.map((d) => <li key={d}><span className="mk">✕</span>{d}</li>)}</ul>
              </div>
              <div className="aid-box aid-signs">
                <span className="aid-label">Danger signs: tell the doctor</span>
                <ul>{AID_SIGNS.map((d) => <li key={d}><span className="mk">!</span>{d}</li>)}</ul>
              </div>
            </div>
          </div>

          <div className="aid-two">
            <div className="aid-box aid-plain">
              <span className="aid-label">Avoid bites</span>
              <ul>{AID_PREVENT.map((d) => <li key={d}><span className="mk">✓</span>{d}</li>)}</ul>
            </div>
            <div className="aid-box aid-plain">
              <span className="aid-label">Snake in your home?</span>
              <ul>{AID_HOME.map((d) => <li key={d}><span className="mk">→</span>{d}</li>)}</ul>
              <a href="#species" className="aid-identify" onClick={(e) => { e.preventDefault(); onIdentify(); }}>Identify common snakes ↑</a>
            </div>
          </div>
          <p className="aid-foot">This guide is general information based on WHO snakebite first-aid advice and is not a substitute for medical care. Medical review by the society's advisors is pending.</p>
        </div>
      </div>
    </div>
  );
}
