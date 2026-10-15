/* Talks to the Supabase database through two checked functions (see the database migration).
   The website key can only call these functions: it cannot read or edit any table. */

const URL = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_KEY;

async function rpc(fn, body) {
  if (!URL || !KEY) throw new Error('Database is not configured (see .env.example)');
  const res = await fetch(`${URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: KEY },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
}

/** Resolves { ok: true, tier } or { duplicate: true }; rejects on any other failure. */
export async function registerMember(data) {
  // the spam check stays in the browser; the server decides the tier itself
  const { captcha, ...payload } = data; // eslint-disable-line no-unused-vars
  const res = await rpc('register_member', { p: payload });
  if (res && res.ok) return res;
  if (res && res.duplicate) return { duplicate: true };
  throw new Error((res && res.error) || 'Registration failed');
}

export async function subscribeNewsletter(email) {
  const res = await rpc('subscribe_newsletter', { p_email: email });
  if (!res || !res.ok) throw new Error((res && res.error) || 'Subscribe failed');
  return res;
}

/** Events, settings and policy text edited in the admin panel; each resolves null if the database can't be reached. */
export const getSiteEvents = () => rpc('get_site_events', {}).catch(() => null);
export const getSiteSettings = () => rpc('get_site_settings', {}).catch(() => null);
export const getPolicies = () => rpc('get_policies', {}).catch(() => null);
export const getPosts = () => rpc('get_posts', {}).catch(() => null);
