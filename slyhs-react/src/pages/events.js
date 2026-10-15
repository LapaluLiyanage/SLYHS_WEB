import { useEffect, useState } from 'react';
import { getSiteEvents } from '../lib/api';
import { useLang } from '../lib/i18n';

// Events shown in "Meet the society". The committee edits them in the admin panel (table `events`,
// see supabase/admin_setup.sql); the list below is only the fallback shown if the database
// can't be reached or has no events yet.
// The card, its button and the section link follow each event's date automatically:
//   no date      -> "Coming soon" / "Idea"
//   future date  -> the date and time (Sri Lanka time), and a "Join the meeting" button
//   past date    -> marked "Past event"
const JOIN = '/join#register';

// words the cards add around the database text, per language
const W = {
  en: { tbd: 'Decided with our first members', whereTbd: 'To be announced', soon: 'Coming soon', idea: 'Idea', past: 'past event', sutra: '(SLST)', interest: 'Register interest', help: 'Join to help plan', next: 'Join for the next one', meet: 'Join the meeting',
    linkJoin: 'Join the first meeting →', linkReg: 'Register for the first meeting →', linkShape: 'Join to shape our events →',
    noteSched: 'The first meeting is scheduled. The other events are ideas we are still planning. Have a suggestion? Tell us when you join.',
    noteTbd: 'The first meeting date will be set once members have joined. The other events are ideas we are still planning. Have a suggestion? Tell us when you join.' },
  si: { tbd: 'අපගේ පළමු සාමාජිකයින් සමඟ තීරණය කෙරේ', whereTbd: 'පසුව දැනුම් දෙනු ලැබේ', soon: 'ඉක්මනින්', idea: 'අදහසක්', past: 'අවසන් සිදුවීම', sutra: '(ශ්‍රී ලංකා වේලාව)', interest: 'උනන්දුව ලියාපදිංචි කරන්න', help: 'සැලසුම් කිරීමට එක්වන්න', next: 'ඊළඟ එකට එක්වන්න', meet: 'රැස්වීමට එක්වන්න',
    linkJoin: 'පළමු රැස්වීමට එක්වන්න →', linkReg: 'පළමු රැස්වීමට ලියාපදිංචි වන්න →', linkShape: 'අපගේ සිදුවීම් හැඩගැස්වීමට එක්වන්න →',
    noteSched: 'පළමු රැස්වීම නියමිතයි. අනෙක් සිදුවීම් අප තවමත් සැලසුම් කරන අදහස් ය. යෝජනාවක් තිබේද? එක්වන විට අපට කියන්න.',
    noteTbd: 'සාමාජිකයින් එක්වූ පසු පළමු රැස්වීමේ දිනය නියම කෙරේ. අනෙක් සිදුවීම් අප තවමත් සැලසුම් කරන අදහස් ය. යෝජනාවක් තිබේද? එක්වන විට අපට කියන්න.' },
  ta: { tbd: 'எங்கள் முதல் உறுப்பினர்களுடன் முடிவு செய்யப்படும்', whereTbd: 'பின்னர் அறிவிக்கப்படும்', soon: 'விரைவில்', idea: 'யோசனை', past: 'முடிந்த நிகழ்வு', sutra: '(இலங்கை நேரம்)', interest: 'ஆர்வத்தைப் பதிவு செய்க', help: 'திட்டமிட உதவ இணையுங்கள்', next: 'அடுத்ததற்கு இணையுங்கள்', meet: 'கூட்டத்தில் இணையுங்கள்',
    linkJoin: 'முதல் கூட்டத்தில் இணையுங்கள் →', linkReg: 'முதல் கூட்டத்திற்குப் பதிவு செய்க →', linkShape: 'எங்கள் நிகழ்வுகளை வடிவமைக்க இணையுங்கள் →',
    noteSched: 'முதல் கூட்டம் திட்டமிடப்பட்டுள்ளது. மற்ற நிகழ்வுகள் இன்னும் திட்டமிடப்படும் யோசனைகள். ஆலோசனை உண்டா? சேரும்போது எங்களிடம் கூறுங்கள்.',
    noteTbd: 'உறுப்பினர்கள் இணைந்த பிறகு முதல் கூட்டத்தின் தேதி நிர்ணயிக்கப்படும். மற்ற நிகழ்வுகள் இன்னும் திட்டமிடப்படும் யோசனைகள். ஆலோசனை உண்டா? சேரும்போது எங்களிடம் கூறுங்கள்.' }
};

export const EVENTS = [
  { id: 'first-meeting', tag: 'First meeting', featured: true, title: 'First online meeting: name the society, meet the committee', where: 'Online', lang: '', date: '', link: '' },
  { id: 'herp-talk', tag: 'Suggestion', title: 'Herp Talk: frogs of the wet zone', where: 'Online', lang: '', date: '', link: '' },
  { id: 'field-walk', tag: 'Suggestion', title: 'Reading a habitat safely: an Explorer field walk', where: '', lang: '', date: '', link: '' }
];

const LOCALE = { en: 'en-GB', si: 'si-LK', ta: 'ta-LK' };
const fmt = (d, o, l = 'en') => new Intl.DateTimeFormat(LOCALE[l] || 'en-GB', { timeZone: 'Asia/Colombo', ...o }).format(d);

/** Only https links are ever used as a button target. */
const safeLink = (l) => (typeof l === 'string' && /^https:\/\//i.test(l) ? l : '');

/** The admin panel's list replaces the built-in one when the database returns events. */
export function mergeRemote(list, remote) {
  if (!Array.isArray(remote) || !remote.length) return list;
  return remote.map((r) => ({ id: r.id, tag: r.tag, title: r.title, featured: !!r.featured, where: r.where, lang: r.lang, date: r.date || '', link: safeLink(r.link) }));
}

export function resolveEvent(e, now = new Date(), l = 'en') {
  const w = W[l] || W.en;
  const base = { ...e, where: e.where || w.whereTbd, lang: e.lang || w.tbd };
  const when = e.date ? new Date(e.date) : null;
  if (!when || Number.isNaN(when.getTime())) {
    return { ...base, status: 'tbd', month: e.featured ? w.soon : w.idea, time: w.tbd, cta: e.featured ? w.interest : w.help, to: JOIN };
  }
  const month = fmt(when, { day: 'numeric', month: 'short', year: 'numeric' }, l);
  const time = fmt(when, { hour: 'numeric', minute: '2-digit', hour12: true }, l).replace(/\s?(am|pm)/i, (_, p) => ' ' + p.toLowerCase()) + ' ' + w.sutra;
  if (when.getTime() + 3 * 3600e3 < now.getTime()) return { ...base, status: 'past', month: month + ' · ' + w.past, time, cta: w.next, to: JOIN };
  return { ...base, status: 'scheduled', month, time, cta: safeLink(e.link) ? w.meet : w.interest, to: safeLink(e.link) || JOIN, external: !!safeLink(e.link) };
}

/** The link beside the section heading follows the first meeting's state. */
export function sectionLink(list, l = 'en') {
  const w = W[l] || W.en;
  const first = list.find((e) => e.featured);
  if (first && first.status === 'scheduled') return { label: first.external ? w.linkJoin : w.linkReg, to: first.to, external: first.external };
  return { label: w.linkShape, to: JOIN };
}

export function eventsNote(list, l = 'en') {
  const w = W[l] || W.en;
  const first = list.find((e) => e.featured);
  if (first && first.status === 'scheduled') return w.noteSched;
  return w.noteTbd;
}

/** Upcoming first (soonest first), then undated ideas, then past events (most recent first). */
export function sortEvents(list) {
  const rank = (e) => (e.status === 'scheduled' ? 0 : e.status === 'tbd' ? 1 : 2);
  const t = (e) => (e.date ? new Date(e.date).getTime() : 0);
  return [...list].sort((a, b) => rank(a) - rank(b) || (rank(a) === 0 ? t(a) - t(b) : rank(a) === 2 ? t(b) - t(a) : 0));
}

let cache;
/** All events: the database list (edited in the admin panel), resolved against the current time. */
export function useEvents() {
  const [remote, setRemote] = useState(cache);
  useEffect(() => {
    if (cache !== undefined) return undefined;
    let dead = false;
    getSiteEvents().then((r) => { cache = r; if (!dead) setRemote(r); });
    return () => { dead = true; };
  }, []);
  const now = useNow(30000);
  const { lang } = useLang();
  return sortEvents(mergeRemote(EVENTS, remote).map((e) => resolveEvent(e, now, lang)));
}

/** A Date that refreshes every `ms` milliseconds. */
export function useNow(ms = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), ms); return () => clearInterval(id); }, [ms]);
  return now;
}

/** { d, h, m, s } until the date, or null once it has started. */
export function timeLeft(date, now = new Date()) {
  const diff = new Date(date).getTime() - now.getTime();
  if (!(diff > 0)) return null;
  const s = Math.floor(diff / 1000);
  return { d: Math.floor(s / 86400), h: Math.floor(s % 86400 / 3600), m: Math.floor(s % 3600 / 60), s: s % 60 };
}
