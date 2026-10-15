import { useEffect, useState } from 'react';
import { getSiteSettings } from './api';

// shown until (or unless) the database answers; the admin panel changes these
const DEFAULTS = {
  contact_email: '', proposer_name: 'Yohan Mithra Fernando', proposer_email: 'mithrayohan@gmail.com', proposer_phone: '0716345560',
  facebook_url: '', instagram_url: '', youtube_url: '', whatsapp_url: ''
};
let cache = null;

/** Only https links and plain email addresses ever reach the page. */
export const safeUrl = (u) => (typeof u === 'string' && /^https:\/\//i.test(u.trim()) ? u.trim() : '');
/** Digits, spaces, + and dashes only, so it is safe in a tel: link. */
export const safePhone = (p) => (typeof p === 'string' && /^\+?[\d\s-]{7,20}$/.test(p.trim()) ? p.trim() : '');
/** Sri Lankan numbers shown as +94 (71) 634 5560; anything else is shown as typed. */
export function formatPhone(p) {
  const d = String(p || '').replace(/[^\d]/g, '');
  const m = d.match(/^(?:94|0)?(\d{2})(\d{3})(\d{4})$/);
  return m ? `+94 (${m[1]}) ${m[2]} ${m[3]}` : p;
}
/** tel: target in international form. */
export const phoneHref = (p) => 'tel:' + (formatPhone(p).startsWith('+94') ? '+94' + String(p).replace(/[^\d]/g, '').slice(-9) : String(p).replace(/[^\d+]/g, ''));
export const safeEmail = (e) => (typeof e === 'string' && /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(e.trim()) ? e.trim() : '');

export function useSiteSettings() {
  const [s, setS] = useState(cache || DEFAULTS);
  useEffect(() => {
    if (cache) return undefined;
    let dead = false;
    getSiteSettings().then((r) => { if (r && !dead) { cache = { ...DEFAULTS, ...r }; setS(cache); } });
    return () => { dead = true; };
  }, []);
  return s;
}
