import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  configured, hasSession, sessionEmail, signIn, signOut, isAdmin, count, list, listNewest, upsert, remove,
  toCsv, download, isoToSl, slToIso, sectionsToText, textToSections
} from '../lib/adminApi';
import '../styles/admin.css';
import { POLICIES } from './policyData';

const TABS = [['overview', 'Overview'], ['events', 'Events'], ['settings', 'Site settings'], ['posts', 'Blog posts'], ['policies', 'Policies'], ['members', 'Members'], ['newsletter', 'Newsletter']];

const SETTINGS = [
  ['proposer_name', 'Proposer name', 'text', 'Shown in the footer'],
  ['proposer_email', 'Proposer email', 'email', 'Shown in the footer and used for "Contact the committee"'],
  ['contact_email', 'Society contact email', 'email', 'Leave empty to hide it. If set, it is shown in the footer and used for "Contact the committee"'],
  ['facebook_url', 'Facebook page', 'url', 'https://… (empty = link hidden)'],
  ['instagram_url', 'Instagram page', 'url', 'https://…'],
  ['youtube_url', 'YouTube channel', 'url', 'https://…'],
  ['whatsapp_url', 'WhatsApp community / group link', 'url', 'https://chat.whatsapp.com/…']
];

const httpsOk = (v) => !v || /^https:\/\//i.test(v);

function useAsync(fn, deps) {
  const [state, setState] = useState({ loading: true, data: null, error: '' });
  const reload = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: '' }));
    fn().then((data) => setState({ loading: false, data, error: '' })).catch((e) => setState({ loading: false, data: null, error: e.message }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => { reload(); }, [reload]);
  return [state, reload];
}

function Msg({ children, kind = 'ok' }) {
  return children ? <p className={'ad-msg ad-' + kind} role={kind === 'err' ? 'alert' : 'status'}>{children}</p> : null;
}

/* ---------------------------------------------------------------- login */
function Login({ onDone }) {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try { await signIn(email.trim(), pw); onDone(); } catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  return (
    <div className="ad-login">
      <form onSubmit={submit} className="ad-card">
        <span className="ad-brand">SLYHS</span>
        <h1>Admin sign in</h1>
        <label>Email<input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label>Password<input type="password" required autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} /></label>
        <Msg kind="err">{err}</Msg>
        <button className="ad-btn ad-primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        <a href="/" className="ad-link">← Back to the website</a>
      </form>
    </div>
  );
}

/* ---------------------------------------------------------------- overview */
function Overview({ go }) {
  const [st] = useAsync(async () => {
    const [members, subs, events] = await Promise.all([count('registrations'), count('newsletter_subscribers'), count('events')]);
    return { members, subs, events };
  }, []);
  const d = st.data;
  return (
    <>
      <h2>Overview</h2>
      <Msg kind="err">{st.error}</Msg>
      <div className="ad-stats">
        <button onClick={() => go('members')}><b>{d ? d.members : '…'}</b><span>Members registered</span></button>
        <button onClick={() => go('newsletter')}><b>{d ? d.subs : '…'}</b><span>Newsletter subscribers</span></button>
        <button onClick={() => go('events')}><b>{d ? d.events : '…'}</b><span>Events</span></button>
      </div>
      <div className="ad-card ad-help">
        <strong>What you can do here</strong>
        <ul>
          <li><b>Events</b>: set the date and meeting link of the first meeting, add or hide events. The website updates by itself.</li>
          <li><b>Site settings</b>: contact email, proposer, social media links.</li>
          <li><b>Blog posts</b>: write, publish and unpublish blog posts. With no published posts the blog page shows "Coming soon".</li>
          <li><b>Policies</b>: edit the Privacy Policy, Code of Ethics and Child Safeguarding pages.</li>
          <li><b>Members</b> and <b>Newsletter</b>: view, search, download as CSV, delete.</li>
        </ul>
      </div>
    </>
  );
}

/* ---------------------------------------------------------------- events */
const blankEvent = () => ({ id: 'ev-' + Date.now().toString(36), title: '', tag: 'Suggestion', featured: false, where_text: '', lang_text: '', starts_at: null, link: '', published: true, sort_order: 10, isNew: true });

function EventCard({ ev, onSaved, onDeleted }) {
  const [f, setF] = useState({ ...ev, when: isoToSl(ev.starts_at) });
  const [msg, setMsg] = useState({ kind: 'ok', text: '' });
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const save = async () => {
    if (!f.title.trim()) return setMsg({ kind: 'err', text: 'Give the event a title.' });
    if (!httpsOk(f.link.trim())) return setMsg({ kind: 'err', text: 'The meeting link must start with https://' });
    try {
      await upsert('events', {
        id: f.id, title: f.title.trim(), tag: f.tag.trim() || 'Event', featured: !!f.featured, where_text: f.where_text.trim(), lang_text: f.lang_text.trim(),
        starts_at: slToIso(f.when), link: f.link.trim(), published: !!f.published, sort_order: Number(f.sort_order) || 0, updated_at: new Date().toISOString()
      });
      setMsg({ kind: 'ok', text: 'Saved. The website shows it now.' });
      onSaved();
    } catch (x) { setMsg({ kind: 'err', text: x.message }); }
  };
  const del = async () => {
    if (!window.confirm(`Delete "${f.title || 'this event'}"? This cannot be undone.`)) return;
    try { if (!ev.isNew) await remove('events', 'id', f.id); onDeleted(); } catch (x) { setMsg({ kind: 'err', text: x.message }); }
  };
  return (
    <div className="ad-card ad-event">
      <div className="ad-grid">
        <label className="ad-wide">Title<input value={f.title} onChange={set('title')} /></label>
        <label>Date and time (Sri Lanka time)<input type="datetime-local" value={f.when} onChange={set('when')} /><small>Empty = date not decided, shows "Coming soon"</small></label>
        <label>Meeting link<input type="url" placeholder="https://zoom.us/j/…" value={f.link} onChange={set('link')} /><small>The "Join the meeting" button uses this</small></label>
        <label>Label<input value={f.tag} onChange={set('tag')} /></label>
        <label>Where<input value={f.where_text} onChange={set('where_text')} placeholder="Online · Zoom" /></label>
        <label>Language<input value={f.lang_text} onChange={set('lang_text')} placeholder="Sinhala, Tamil, English" /></label>
        <label>Order<input type="number" value={f.sort_order} onChange={set('sort_order')} /></label>
        <label className="ad-check"><input type="checkbox" checked={f.featured} onChange={set('featured')} /> Highlight as the first meeting</label>
        <label className="ad-check"><input type="checkbox" checked={f.published} onChange={set('published')} /> Show on the website</label>
      </div>
      <div className="ad-row">
        <button className="ad-btn ad-primary" onClick={save}>Save</button>
        <button className="ad-btn ad-danger" onClick={del}>Delete</button>
        <Msg kind={msg.kind}>{msg.text}</Msg>
      </div>
    </div>
  );
}

function Events() {
  const [st, reload] = useAsync(() => list('events', '&order=sort_order.asc'), []);
  const [extra, setExtra] = useState([]);
  const rows = st.data || [];
  return (
    <>
      <div className="ad-head"><h2>Events</h2><button className="ad-btn" onClick={() => setExtra((x) => [...x, blankEvent()])}>+ Add event</button></div>
      <p className="ad-hint">Set a date and the website shows it automatically; a meeting link turns the button into "Join the meeting". After the start time passes, the card is marked as a past event.</p>
      <Msg kind="err">{st.error}</Msg>
      {st.loading && <p className="ad-hint">Loading…</p>}
      {!st.loading && !st.error && !rows.length && !extra.length && <Msg kind="err">No events yet. Run supabase/admin_setup.sql (it adds the first three), or click Add event.</Msg>}
      {rows.map((ev) => <EventCard key={ev.id} ev={ev} onSaved={reload} onDeleted={reload} />)}
      {extra.map((ev) => <EventCard key={ev.id} ev={ev} onSaved={() => { setExtra((x) => x.filter((e) => e.id !== ev.id)); reload(); }} onDeleted={() => setExtra((x) => x.filter((e) => e.id !== ev.id))} />)}
    </>
  );
}

/* ---------------------------------------------------------------- settings */
function Settings() {
  const [st] = useAsync(() => list('site_settings'), []);
  const [vals, setVals] = useState(null);
  const [msg, setMsg] = useState({ kind: 'ok', text: '' });
  useEffect(() => { if (st.data) setVals(Object.fromEntries(SETTINGS.map(([k]) => [k, (st.data.find((r) => r.key === k) || {}).value || '']))); }, [st.data]);
  const save = async () => {
    for (const [k, label, type] of SETTINGS) {
      const v = vals[k].trim();
      if (type === 'url' && !httpsOk(v)) return setMsg({ kind: 'err', text: `${label}: the link must start with https://` });
      if (type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return setMsg({ kind: 'err', text: `${label}: not a valid email address` });
    }
    try {
      await upsert('site_settings', SETTINGS.map(([k]) => ({ key: k, value: vals[k].trim(), updated_at: new Date().toISOString() })), 'key');
      setMsg({ kind: 'ok', text: 'Saved. The website shows these now.' });
    } catch (x) { setMsg({ kind: 'err', text: x.message }); }
  };
  return (
    <>
      <h2>Site settings</h2>
      <Msg kind="err">{st.error}</Msg>
      {vals && (
        <div className="ad-card">
          <div className="ad-grid ad-one">
            {SETTINGS.map(([k, label, type, hint]) => (
              <label key={k}>{label}<input type={type === 'text' ? 'text' : type} value={vals[k]} onChange={(e) => setVals((p) => ({ ...p, [k]: e.target.value }))} /><small>{hint}</small></label>
            ))}
          </div>
          <div className="ad-row"><button className="ad-btn ad-primary" onClick={save}>Save settings</button><Msg kind={msg.kind}>{msg.text}</Msg></div>
        </div>
      )}
    </>
  );
}

/* ---------------------------------------------------------------- blog posts */
const slugify = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
const blankPost = () => ({ slug: '', title: '', excerpt: '', body: '', cover_url: '', author: '', published: false, published_at: null, isNew: true });

function PostCard({ post, onSaved, onDeleted }) {
  const [f, setF] = useState(post);
  const [msg, setMsg] = useState({ kind: 'ok', text: '' });
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const save = async () => {
    const slug = post.isNew ? (f.slug.trim() || slugify(f.title)) : post.slug;
    if (!f.title.trim()) return setMsg({ kind: 'err', text: 'Give the post a title.' });
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return setMsg({ kind: 'err', text: 'The web address (slug) can only use lowercase letters, numbers and dashes.' });
    if (!httpsOk(f.cover_url.trim())) return setMsg({ kind: 'err', text: 'The cover image link must start with https://' });
    try {
      await upsert('posts', {
        slug, title: f.title.trim(), excerpt: f.excerpt.trim(), body: f.body, cover_url: f.cover_url.trim(), author: f.author.trim(),
        published: !!f.published, published_at: f.published ? (f.published_at || new Date().toISOString()) : f.published_at, updated_at: new Date().toISOString()
      }, 'slug');
      setMsg({ kind: 'ok', text: f.published ? 'Saved and live on the blog.' : 'Saved as a draft (not visible on the website).' });
      onSaved();
    } catch (x) { setMsg({ kind: 'err', text: x.message }); }
  };
  const del = async () => {
    if (!window.confirm(`Delete "${f.title || 'this post'}"? This cannot be undone.`)) return;
    try { if (!post.isNew) await remove('posts', 'slug', post.slug); onDeleted(); } catch (x) { setMsg({ kind: 'err', text: x.message }); }
  };
  return (
    <div className="ad-card">
      <div className="ad-grid">
        <label className="ad-wide">Title<input value={f.title} onChange={set('title')} /></label>
        <label>Web address {post.isNew ? '' : '(fixed)'}<input value={post.isNew ? f.slug : post.slug} disabled={!post.isNew} placeholder={slugify(f.title) || 'my-first-post'} onChange={set('slug')} /><small>/blog/{post.isNew ? (f.slug || slugify(f.title) || '…') : post.slug}</small></label>
        <label>Author<input value={f.author} onChange={set('author')} /></label>
        <label className="ad-wide">Cover image link (optional)<input type="url" placeholder="https://…" value={f.cover_url} onChange={set('cover_url')} /></label>
        <label className="ad-wide">Short summary<input value={f.excerpt} onChange={set('excerpt')} /><small>Shown on the blog list and under the title</small></label>
        <label className="ad-wide">Post text<textarea rows={14} value={f.body} onChange={set('body')} /><small>Plain text. Start a heading with "## ". Separate paragraphs with a blank line.</small></label>
        <label className="ad-check"><input type="checkbox" checked={f.published} onChange={set('published')} /> Published (visible on the website)</label>
      </div>
      <div className="ad-row">
        <button className="ad-btn ad-primary" onClick={save}>Save</button>
        {!post.isNew && <a className="ad-link" href={'/blog/' + post.slug} target="_blank" rel="noopener noreferrer">View ↗</a>}
        <button className="ad-btn ad-danger" onClick={del}>Delete</button>
        <Msg kind={msg.kind}>{msg.text}</Msg>
      </div>
    </div>
  );
}

function Posts() {
  const [st, reload] = useAsync(() => list('posts', '&order=created_at.desc'), []);
  const [extra, setExtra] = useState([]);
  const rows = st.data || [];
  return (
    <>
      <div className="ad-head"><h2>Blog posts</h2><button className="ad-btn" onClick={() => setExtra((x) => [{ ...blankPost(), key: Date.now() }, ...x])}>+ New post</button></div>
      <p className="ad-hint">Only published posts appear on the website. While there are none, the blog page shows "Coming soon" with the newsletter signup.</p>
      <Msg kind="err">{st.error}</Msg>
      {st.loading && <p className="ad-hint">Loading…</p>}
      {extra.map((p) => <PostCard key={p.key} post={p} onSaved={() => { setExtra((x) => x.filter((e) => e.key !== p.key)); reload(); }} onDeleted={() => setExtra((x) => x.filter((e) => e.key !== p.key))} />)}
      {rows.map((p) => <PostCard key={p.slug + p.updated_at} post={p} onSaved={reload} onDeleted={reload} />)}
      {!st.loading && !st.error && !rows.length && !extra.length && <p className="ad-hint">No posts yet.</p>}
    </>
  );
}

/* ---------------------------------------------------------------- policies */
function PolicyEditor({ slug, saved, onSaved }) {
  const base = POLICIES[slug];
  const src = saved || base;
  const [f, setF] = useState({ title: src.title, lead: src.lead, updated: src.updated, text: sectionsToText(src.sections) });
  const [msg, setMsg] = useState({ kind: 'ok', text: '' });
  const save = async () => {
    const sections = textToSections(f.text);
    if (!f.title.trim() || !sections.length) return setMsg({ kind: 'err', text: 'Needs a title and at least one "## Heading" section with text.' });
    try {
      await upsert('policies', { slug, title: f.title.trim(), lead: f.lead.trim(), updated: f.updated.trim(), sections, updated_at: new Date().toISOString() }, 'slug');
      setMsg({ kind: 'ok', text: 'Saved. The page is updated.' });
      onSaved();
    } catch (x) { setMsg({ kind: 'err', text: x.message }); }
  };
  const reset = async () => {
    if (!window.confirm('Remove your edits and go back to the original text?')) return;
    try { await remove('policies', 'slug', slug); onSaved(); setMsg({ kind: 'ok', text: 'Back to the original text.' }); setF({ title: base.title, lead: base.lead, updated: base.updated, text: sectionsToText(base.sections) }); } catch (x) { setMsg({ kind: 'err', text: x.message }); }
  };
  return (
    <div className="ad-card">
      <div className="ad-head"><strong>/{slug}</strong><a className="ad-link" href={'/' + slug} target="_blank" rel="noopener noreferrer">View page ↗</a></div>
      <div className="ad-grid">
        <label>Title<input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></label>
        <label>Last updated<input value={f.updated} onChange={(e) => setF({ ...f, updated: e.target.value })} /></label>
        <label className="ad-wide">Short intro<input value={f.lead} onChange={(e) => setF({ ...f, lead: e.target.value })} /></label>
        <label className="ad-wide">Content<textarea rows={16} value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} /><small>Start each section with "## Heading". Separate paragraphs with a blank line.</small></label>
      </div>
      <div className="ad-row">
        <button className="ad-btn ad-primary" onClick={save}>Save</button>
        {saved && <button className="ad-btn" onClick={reset}>Reset to original</button>}
        <Msg kind={msg.kind}>{msg.text}</Msg>
      </div>
    </div>
  );
}

function Policies() {
  const [st, reload] = useAsync(() => list('policies'), []);
  return (
    <>
      <h2>Policies</h2>
      <p className="ad-hint">The text shown here is what the page currently says. Edit and save to publish your version.</p>
      <Msg kind="err">{st.error}</Msg>
      {st.data && Object.keys(POLICIES).map((slug) => {
        const row = st.data.find((r) => r.slug === slug);
        return <PolicyEditor key={slug + (row ? row.updated_at : '')} slug={slug} saved={row} onSaved={reload} />;
      })}
    </>
  );
}

/* ---------------------------------------------------------------- data tables */
const pretty = (k) => k.replace(/_/g, ' ');
const shorten = (v) => { const t = v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v); return t.length > 60 ? t.slice(0, 57) + '…' : t; };

function DataTable({ table, title, idCol, keyCols, csvName }) {
  const [st, reload] = useAsync(() => listNewest(table), [table]);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(null);
  const rows = st.data || [];
  const shown = useMemo(() => { const n = q.trim().toLowerCase(); return n ? rows.filter((r) => JSON.stringify(r).toLowerCase().includes(n)) : rows; }, [rows, q]);
  const picked = keyCols.filter((c) => rows.some((r) => c in r));
  const cols = picked.length >= 2 ? picked : Object.keys(rows[0] || {}).slice(0, 6);
  const canDelete = rows.length > 0 && 'id' in rows[0];
  const del = async (r) => {
    if (!window.confirm('Delete this record permanently? This cannot be undone.')) return;
    try { await remove(table, idCol, r[idCol]); setOpen(null); reload(); } catch (x) { window.alert(x.message); }
  };
  return (
    <>
      <div className="ad-head"><h2>{title} <span className="ad-count">{rows.length}</span></h2>
        <button className="ad-btn" disabled={!rows.length} onClick={() => download(csvName + '-' + new Date().toISOString().slice(0, 10) + '.csv', toCsv(shown))}>Download CSV{q ? ' (filtered)' : ''}</button></div>
      <input className="ad-search" type="search" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
      <Msg kind="err">{st.error}</Msg>
      {st.loading && <p className="ad-hint">Loading…</p>}
      {!st.loading && !st.error && !rows.length && <p className="ad-hint">Nothing here yet.</p>}
      {shown.length > 0 && (
        <div className="ad-tablewrap">
          <table>
            <thead><tr>{cols.map((c) => <th key={c}>{pretty(c)}</th>)}<th /></tr></thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r[idCol] || JSON.stringify(r)}>
                  {cols.map((c) => <td key={c}>{shorten(r[c])}</td>)}
                  <td className="ad-actions"><button className="ad-btn ad-sm" onClick={() => setOpen(r)}>View</button>{canDelete && <button className="ad-btn ad-sm ad-danger" onClick={() => del(r)}>Delete</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {open && (
        <div className="ad-modal" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) setOpen(null); }}>
          <div className="ad-card ad-modalbox">
            <div className="ad-head"><strong>Record details</strong><button className="ad-btn ad-sm" onClick={() => setOpen(null)}>Close</button></div>
            <dl>{Object.entries(open).map(([k, v]) => <div key={k}><dt>{pretty(k)}</dt><dd>{v === null || v === '' ? '—' : typeof v === 'object' ? JSON.stringify(v) : String(v)}</dd></div>)}</dl>
          </div>
        </div>
      )}
    </>
  );
}

/* ---------------------------------------------------------------- shell */
export default function Admin() {
  const [state, setState] = useState(hasSession() ? 'checking' : 'out');
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    document.title = 'Admin · SLYHS';
    const meta = document.createElement('meta');
    meta.name = 'robots'; meta.content = 'noindex,nofollow';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);
  useEffect(() => {
    if (state !== 'checking') return;
    isAdmin().then((ok) => setState(ok ? 'in' : 'out'));
  }, [state]);

  if (!configured()) return <div className="ad-login"><div className="ad-card"><h1>Database not configured</h1><p>Set VITE_SUPABASE_URL and VITE_SUPABASE_KEY (see .env.example).</p></div></div>;
  if (state === 'checking') return <div className="ad-login"><p className="ad-hint">Checking sign-in…</p></div>;
  if (state === 'out') return <Login onDone={() => setState('in')} />;

  const out = async () => { await signOut(); setState('out'); };
  return (
    <div className="ad-shell">
      <aside className="ad-side">
        <span className="ad-brand">SLYHS admin</span>
        <nav aria-label="Admin sections">
          {TABS.map(([k, label]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{label}</button>)}
        </nav>
        <div className="ad-who"><span>{sessionEmail()}</span><button className="ad-btn ad-sm" onClick={out}>Sign out</button><a className="ad-link" href="/">View website ↗</a></div>
      </aside>
      <main className="ad-main">
        {tab === 'overview' && <Overview go={setTab} />}
        {tab === 'events' && <Events />}
        {tab === 'settings' && <Settings />}
        {tab === 'posts' && <Posts />}
        {tab === 'policies' && <Policies />}
        {tab === 'members' && <DataTable table="registrations" title="Members" idCol="id" csvName="slyhs-members" keyCols={['created_at', 'full_name', 'email', 'district', 'tier', 'phone', 'dob']} />}
        {tab === 'newsletter' && <DataTable table="newsletter_subscribers" title="Newsletter subscribers" idCol="id" csvName="slyhs-newsletter" keyCols={['created_at', 'email']} />}
      </main>
    </div>
  );
}
