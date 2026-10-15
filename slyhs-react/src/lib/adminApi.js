/* Admin panel client: Supabase Auth (email + password) and direct table access.
   Every table call carries the signed-in user's token; row-level security only lets users listed
   in public.admins through (see supabase/admin_setup.sql). */

const URL = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_KEY;
const STORE = 'slyhs-admin-session';

let session = null;
try { session = JSON.parse(localStorage.getItem(STORE)); } catch { session = null; }

const save = (s) => {
  session = s;
  try { if (s) localStorage.setItem(STORE, JSON.stringify(s)); else localStorage.removeItem(STORE); } catch { /* private mode */ }
};
const fromToken = (j) => ({ access_token: j.access_token, refresh_token: j.refresh_token, expires_at: Date.now() + (j.expires_in || 3600) * 1000, email: j.user && j.user.email });

export const configured = () => Boolean(URL && KEY);
export const hasSession = () => Boolean(session && session.access_token);
export const sessionEmail = () => (session && session.email) || '';

const SETPW = 'slyhs-admin-setpw';
export const needsPassword = () => { try { return sessionStorage.getItem(SETPW) === '1'; } catch { return false; } };
export const passwordDone = () => { try { sessionStorage.removeItem(SETPW); } catch { /* private mode */ } };

/** An invite / password-reset email lands on the site with #access_token=… : keep that session and open the admin page to set a password. */
export function adoptEmailLink() {
  const h = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const token = h.get('access_token');
  if (!token || !['invite', 'recovery', 'magiclink'].includes(h.get('type'))) return false;
  let email = '';
  try { email = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).email || ''; } catch { /* unreadable token */ }
  save({ access_token: token, refresh_token: h.get('refresh_token'), expires_at: Date.now() + (Number(h.get('expires_in')) || 3600) * 1000, email });
  try { sessionStorage.setItem(SETPW, '1'); } catch { /* private mode */ }
  window.history.replaceState(null, '', '/admin');
  return true;
}

export async function setPassword(password) {
  const token = await freshToken();
  const res = await fetch(`${URL}/auth/v1/user`, { method: 'PUT', headers: { 'Content-Type': 'application/json', apikey: KEY, Authorization: `Bearer ${token}` }, body: JSON.stringify({ password }) });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j.msg || j.error_description || 'Could not set the password');
}

async function auth(path, body) {
  const res = await fetch(`${URL}/auth/v1/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: KEY }, body: JSON.stringify(body) });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j.error_description || j.msg || 'Sign-in failed');
  return j;
}

export async function signIn(email, password) {
  save(fromToken(await auth('token?grant_type=password', { email, password })));
  if (!(await isAdmin())) {
    await signOut();
    throw new Error('This account is not an admin. Add it to the admins table first.');
  }
}

export async function signOut() {
  if (session) fetch(`${URL}/auth/v1/logout`, { method: 'POST', headers: { apikey: KEY, Authorization: `Bearer ${session.access_token}` } }).catch(() => {});
  save(null);
}

async function freshToken() {
  if (!session) throw new Error('Signed out');
  if (session.expires_at - Date.now() > 60000) return session.access_token;
  try {
    save(fromToken(await auth('token?grant_type=refresh_token', { refresh_token: session.refresh_token })));
  } catch {
    save(null);
    throw new Error('Session expired. Sign in again.');
  }
  return session.access_token;
}

async function call(path, { method = 'GET', body, prefer, rpc } = {}) {
  const token = await freshToken();
  const res = await fetch(`${URL}/rest/v1/${rpc ? 'rpc/' : ''}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', apikey: KEY, Authorization: `Bearer ${token}`, ...(prefer ? { Prefer: prefer } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.message || `Request failed (${res.status})`);
  }
  const range = res.headers.get('Content-Range');
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  return { data, count: range && range.includes('/') ? Number(range.split('/')[1]) || 0 : null };
}

export async function isAdmin() {
  try { return (await call('is_admin', { method: 'POST', body: {}, rpc: true })).data === true; } catch { return false; }
}

/** Uploads a photo to the public `animal-photos` bucket (admins only) and returns its public https URL. */
export async function uploadPhoto(file, name) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error('Use a JPG, PNG or WebP photo.');
  if (file.size > 3 * 1024 * 1024) throw new Error('The photo is over 3 MB. Shrink it first.');
  const token = await freshToken();
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `${name}-${Date.now().toString(36)}.${ext}`;
  const res = await fetch(`${URL}/storage/v1/object/animal-photos/${path}`, { method: 'POST', headers: { apikey: KEY, Authorization: `Bearer ${token}`, 'Content-Type': file.type, 'x-upsert': 'false' }, body: file });
  if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.message || 'Upload failed. Has animals.sql been run in Supabase?'); }
  return `${URL}/storage/v1/object/public/animal-photos/${path}`;
}

export const count = async (table) => (await call(`${table}?select=*&limit=1`, { prefer: 'count=exact' })).count;
export const list = async (table, query = '') => (await call(`${table}?select=*${query}`)).data || [];
export const upsert = (table, row, key = 'id') => call(`${table}?on_conflict=${key}`, { method: 'POST', body: row, prefer: 'resolution=merge-duplicates,return=minimal' });
export const remove = (table, col, val) => call(`${table}?${col}=eq.${encodeURIComponent(val)}`, { method: 'DELETE', prefer: 'return=minimal' });

/** Newest first when the table has created_at; falls back to the default order otherwise. */
export async function listNewest(table) {
  try { return await list(table, '&order=created_at.desc'); } catch { return list(table); }
}

/* ---- helpers used by the screens ---- */
export function toCsv(rows) {
  if (!rows.length) return '';
  const cols = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  // a leading = + - @ would run as a formula when opened in a spreadsheet, so it is defused
  const cell = (v) => {
    let t = v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);
    if (/^[=+\-@\t\r]/.test(t)) t = "'" + t;
    return '"' + t.replace(/"/g, '""') + '"';
  };
  return [cols.join(','), ...rows.map((r) => cols.map((c) => cell(r[c])).join(','))].join('\r\n');
}

export function download(name, text) {
  const a = document.createElement('a');
  a.href = window.URL.createObjectURL(new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8' }));
  a.download = name;
  a.click();
  window.URL.revokeObjectURL(a.href);
}

/** Sri Lanka local time (UTC+5:30) <-> the value of a datetime-local input. */
export const isoToSl = (iso) => (iso ? new Date(new Date(iso).getTime() + 5.5 * 3600e3).toISOString().slice(0, 16) : '');
export const slToIso = (v) => (v ? new Date(v + ':00+05:30').toISOString() : null);

/** Policy sections <-> an easy text format: "## Heading" then paragraphs separated by blank lines. */
export const sectionsToText = (secs) => secs.map(([h, ps]) => `## ${h}\n\n${ps.join('\n\n')}`).join('\n\n');
export function textToSections(text) {
  const out = [];
  text.split(/\n(?=## )/).forEach((block) => {
    const m = block.trim().match(/^##\s*(.+?)\s*\n([\s\S]*)$/);
    if (!m) return;
    const ps = m[2].split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    if (ps.length) out.push([m[1], ps]);
  });
  return out;
}
