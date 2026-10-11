import { Fragment } from 'react';

/**
 * Renders text as masked words (<span.w><span.wi>) so GSAP can animate each word.
 * `parts` is a list of strings or { text, serif, grad } segments.
 */
export default function Split({ parts }) {
  const out = [];
  parts.forEach((p, pi) => {
    const part = typeof p === 'string' ? { text: p } : p;
    const words = part.text.trim().split(/\s+/).filter(Boolean);
    const spaced = [];
    words.forEach((w, wi) => {
      if (wi) spaced.push(' ');
      spaced.push(<span className="w" key={wi}><span className="wi">{w}</span></span>);
    });
    if (pi) out.push(' ');
    if (part.serif) {
      out.push(<span key={pi} className={'serif' + (part.grad ? ' grad-text is-split' : '')}>{spaced}</span>);
    } else {
      out.push(<Fragment key={pi}>{spaced}</Fragment>);
    }
  });
  return out;
}
