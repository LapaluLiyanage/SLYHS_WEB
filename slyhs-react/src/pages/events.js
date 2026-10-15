import { useEffect, useState } from 'react';
import { getSiteEvents } from '../lib/api';

// Events shown in "Meet the society". The committee edits them in the admin panel (table `events`,
// see supabase/admin_setup.sql); the list below is only the fallback shown if the database
// can't be reached or has no events yet.
// The card, its button and the section link follow each event's date automatically:
//   no date      -> "Coming soon" / "Idea"
//   future date  -> the date and time (Sri Lanka time), and a "Join the meeting" button
//   past date    -> marked "Past event"
const TBD = 'Decided with our first members';
const WHERE_TBD = 'To be announced';
const JOIN = '/join#register';

export const EVENTS = [
  { id: 'first-meeting', tag: 'First meeting', featured: true, title: 'First online meeting: name the society, meet the committee', where: 'Online', lang: '', date: '', link: '' },
  { id: 'herp-talk', tag: 'Suggestion', title: 'Herp Talk: frogs of the wet zone', where: 'Online', lang: '', date: '', link: '' },
  { id: 'field-walk', tag: 'Suggestion', title: 'Reading a habitat safely: an Explorer field walk', where: '', lang: '', date: '', link: '' }
];

const fmt = (d, o) => new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Colombo', ...o }).format(d);

/** Only https links are ever used as a button target. */
const safeLink = (l) => (typeof l === 'string' && /^https:\/\//i.test(l) ? l : '');

/** The admin panel's list replaces the built-in one when the database returns events. */
export function mergeRemote(list, remote) {
  if (!Array.isArray(remote) || !remote.length) return list;
  return remote.map((r) => ({ id: r.id, tag: r.tag, title: r.title, featured: !!r.featured, where: r.where, lang: r.lang, date: r.date || '', link: safeLink(r.link) }));
}

export function resolveEvent(e, now = new Date()) {
  const base = { ...e, where: e.where || WHERE_TBD, lang: e.lang || TBD };
  const when = e.date ? new Date(e.date) : null;
  if (!when || Number.isNaN(when.getTime())) {
    return { ...base, status: 'tbd', month: e.featured ? 'Coming soon' : 'Idea', time: TBD, cta: e.featured ? 'Register interest' : 'Join to help plan', to: JOIN };
  }
  const month = fmt(when, { day: 'numeric', month: 'short', year: 'numeric' });
  const time = fmt(when, { hour: 'numeric', minute: '2-digit', hour12: true }).replace(/\s?(am|pm)/i, (_, p) => ' ' + p.toLowerCase()) + ' (SLST)';
  if (when.getTime() + 3 * 3600e3 < now.getTime()) return { ...base, status: 'past', month: month + ' · past event', time, cta: 'Join for the next one', to: JOIN };
  return { ...base, status: 'scheduled', month, time, cta: safeLink(e.link) ? 'Join the meeting' : 'Register interest', to: safeLink(e.link) || JOIN, external: !!safeLink(e.link) };
}

/** The link beside the section heading follows the first meeting's state. */
export function sectionLink(list) {
  const first = list.find((e) => e.featured);
  if (first && first.status === 'scheduled') return { label: first.external ? 'Join the first meeting →' : 'Register for the first meeting →', to: first.to, external: first.external };
  return { label: 'Join to shape our events →', to: JOIN };
}

export function eventsNote(list) {
  const first = list.find((e) => e.featured);
  if (first && first.status === 'scheduled') return 'The first meeting is scheduled. The other events are ideas we are still planning. Have a suggestion? Tell us when you join.';
  return 'The first meeting date will be set once members have joined. The other events are ideas we are still planning. Have a suggestion? Tell us when you join.';
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
  return sortEvents(mergeRemote(EVENTS, remote).map((e) => resolveEvent(e, now)));
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
