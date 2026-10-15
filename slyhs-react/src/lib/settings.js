import { useEffect, useState } from 'react';
import { getSiteSettings } from './api';

// shown until (or unless) the database answers; the admin panel changes these
const DEFAULTS = {
  contact_email: '', proposer_name: 'Mithra Yohan', proposer_email: 'mithrayohan@gmail.com',
  facebook_url: '', instagram_url: '', youtube_url: '', whatsapp_url: ''
};
let cache = null;

/** Only https links and plain email addresses ever reach the page. */
export const safeUrl = (u) => (typeof u === 'string' && /^https:\/\//i.test(u.trim()) ? u.trim() : '');
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
