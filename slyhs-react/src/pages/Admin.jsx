import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  configured, hasSession, needsPassword, passwordDone, setPassword, sessionEmail, signIn, signOut, isAdmin, count, list, listNewest, upsert, remove,
  toCsv, download, isoToSl, slToIso, uploadPhoto, sectionsToText, textToSections
} from '../lib/adminApi';
import '../styles/admin.css';
import { POLICIES } from './policyData';
import { SPECIES, FP } from './speciesData';

const TABS = [['overview', 'Overview'], ['events', 'Events'], ['settings', 'Site settings'], ['animals', 'Animals'], ['posts', 'Blog posts'], ['policies', 'Policies'], ['members', 'Members'], ['newsletter', 'Newsletter']];

const SETTINGS = [
  ['proposer_name', 'Proposer name', 'text', 'Shown in the footer'],
  ['proposer_phone', 'Proposer phone', 'tel', 'Shown in the footer (contact)'],
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
  return children ? <p className={'adm-msg adm-' + kind} role={kind === 'err' ? 'alert' : 'status'}>{children}</p> : null;
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
    <div className="adm-login">
      <form onSubmit={submit} className="adm-card">
        <span className="adm-brand">SLYHS</span>
        <h1>Admin sign in</h1>
        <label>Email<input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label>Password<input type="password" required autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} /></label>
        <Msg kind="err">{err}</Msg>
        <button className="adm-btn adm-primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        <a href="/" className="adm-link">← Back to the website</a>
      </form>
    </div>
  );
}

function SetPassword({ onDone }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (pw.length < 8) return setErr('Use at least 8 characters.');
    setBusy(true); setErr('');
    try { await setPassword(pw); passwordDone(); onDone(); } catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  return (
    <div className="adm-login">
      <form onSubmit={submit} className="adm-card">
        <span className="adm-brand">SLYHS</span>
        <h1>Choose your password</h1>
        <p className="adm-hint">{sessionEmail()} is confirmed. Pick a password to use for future sign-ins.</p>
        <label>New password<input type="password" required minLength={8} autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} /></label>
        <Msg kind="err">{err}</Msg>
        <button className="adm-btn adm-primary" disabled={busy}>{busy ? 'Saving…' : 'Save and continue'}</button>
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
      <div className="adm-stats">
        <button onClick={() => go('members')}><b>{d ? d.members : '…'}</b><span>Members registered</span></button>
        <button onClick={() => go('newsletter')}><b>{d ? d.subs : '…'}</b><span>Newsletter subscribers</span></button>
        <button onClick={() => go('events')}><b>{d ? d.events : '…'}</b><span>Events</span></button>
      </div>
      <div className="adm-card adm-help">
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
    <div className="adm-card adm-event">
      <div className="adm-grid">
        <label className="adm-wide">Title<input value={f.title} onChange={set('title')} /></label>
        <label>Date and time (Sri Lanka time)<input type="datetime-local" value={f.when} onChange={set('when')} /><small>Empty = date not decided, shows "Coming soon"</small></label>
        <label>Meeting link<input type="url" placeholder="https://zoom.us/j/…" value={f.link} onChange={set('link')} /><small>The "Join the meeting" button uses this</small></label>
        <label>Label<input value={f.tag} onChange={set('tag')} /></label>
        <label>Where<input value={f.where_text} onChange={set('where_text')} placeholder="Online · Zoom" /></label>
        <label>Language<input value={f.lang_text} onChange={set('lang_text')} placeholder="Sinhala, Tamil, English" /></label>
        <label>Order<input type="number" value={f.sort_order} onChange={set('sort_order')} /></label>
        <label className="adm-check"><input type="checkbox" checked={f.featured} onChange={set('featured')} /> Highlight as the first meeting</label>
        <label className="adm-check"><input type="checkbox" checked={f.published} onChange={set('published')} /> Show on the website</label>
      </div>
      <div className="adm-row">
        <button className="adm-btn adm-primary" onClick={save}>Save</button>
        <button className="adm-btn adm-danger" onClick={del}>Delete</button>
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
      <div className="adm-head"><h2>Events</h2><button className="adm-btn" onClick={() => setExtra((x) => [...x, blankEvent()])}>+ Add event</button></div>
      <p className="adm-hint">Set a date and the website shows it automatically; a meeting link turns the button into "Join the meeting". After the start time passes, the card is marked as a past event.</p>
      <Msg kind="err">{st.error}</Msg>
      {st.loading && <p className="adm-hint">Loading…</p>}
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
        <div className="adm-card">
          <div className="adm-grid adm-one">
            {SETTINGS.map(([k, label, type, hint]) => (
              <label key={k}>{label}<input type={type === 'text' ? 'text' : type} value={vals[k]} onChange={(e) => setVals((p) => ({ ...p, [k]: e.target.value }))} /><small>{hint}</small></label>
            ))}
          </div>
          <div className="adm-row"><button className="adm-btn adm-primary" onClick={save}>Save settings</button><Msg kind={msg.kind}>{msg.text}</Msg></div>
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
    <div className="adm-card">
      <div className="adm-grid">
        <label className="adm-wide">Title<input value={f.title} onChange={set('title')} /></label>
        <label>Web address {post.isNew ? '' : '(fixed)'}<input value={post.isNew ? f.slug : post.slug} disabled={!post.isNew} placeholder={slugify(f.title) || 'my-first-post'} onChange={set('slug')} /><small>/blog/{post.isNew ? (f.slug || slugify(f.title) || '…') : post.slug}</small></label>
        <label>Author<input value={f.author} onChange={set('author')} /></label>
        <label className="adm-wide">Cover image link (optional)<input type="url" placeholder="https://…" value={f.cover_url} onChange={set('cover_url')} /></label>
        <label className="adm-wide">Short summary<input value={f.excerpt} onChange={set('excerpt')} /><small>Shown on the blog list and under the title</small></label>
        <label className="adm-wide">Post text<textarea rows={14} value={f.body} onChange={set('body')} /><small>Plain text. Start a heading with "## ". Separate paragraphs with a blank line.</small></label>
        <label className="adm-check"><input type="checkbox" checked={f.published} onChange={set('published')} /> Published (visible on the website)</label>
      </div>
      <div className="adm-row">
        <button className="adm-btn adm-primary" onClick={save}>Save</button>
        {!post.isNew && <a className="adm-link" href={'/blog/' + post.slug} target="_blank" rel="noopener noreferrer">View ↗</a>}
        <button className="adm-btn adm-danger" onClick={del}>Delete</button>
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
      <div className="adm-head"><h2>Blog posts</h2><button className="adm-btn" onClick={() => setExtra((x) => [{ ...blankPost(), key: Date.now() }, ...x])}>+ New post</button></div>
      <p className="adm-hint">Only published posts appear on the website. While there are none, the blog page shows "Coming soon" with the newsletter signup.</p>
      <Msg kind="err">{st.error}</Msg>
      {st.loading && <p className="adm-hint">Loading…</p>}
      {extra.map((p) => <PostCard key={p.key} post={p} onSaved={() => { setExtra((x) => x.filter((e) => e.key !== p.key)); reload(); }} onDeleted={() => setExtra((x) => x.filter((e) => e.key !== p.key))} />)}
      {rows.map((p) => <PostCard key={p.slug + p.updated_at} post={p} onSaved={reload} onDeleted={reload} />)}
      {!st.loading && !st.error && !rows.length && !extra.length && <p className="adm-hint">No posts yet.</p>}
    </>
  );
}

/* ---------------------------------------------------------------- animals */
const KINDS = ['Snakes', 'Frogs', 'Lizards', 'Turtles'];
const STATUSES = ['', 'Least Concern', 'Near Threatened', 'Vulnerable', 'Endangered'];
const slugOf = (n) => n.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const blankAnimal = () => ({ id: '', name: '', sci: '', local_name: '', kind: 'Snakes', group_text: '', status: '', danger: '', endemic: true, size_label: '', image_url: '', credit: '', description: '', facts: '', published: true, sort_order: 100, isNew: true });

function AnimalCard({ animal, onSaved, onDeleted }) {
  const [f, setF] = useState(animal);
  const [msg, setMsg] = useState({ kind: 'ok', text: '' });
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const [busy, setBusy] = useState(false);
  const pick = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true); setMsg({ kind: 'ok', text: 'Uploading…' });
    try {
      const url = await uploadPhoto(file, slugOf(f.name) || 'animal');
      setF((p) => ({ ...p, image_url: url }));
      setMsg({ kind: 'ok', text: 'Photo uploaded. Press Save to use it on the website.' });
    } catch (x) { setMsg({ kind: 'err', text: x.message }); } finally { setBusy(false); }
  };
  const save = async () => {
    const id = f.isNew ? slugOf(f.name) : f.id;
    if (!f.name.trim() || !id) return setMsg({ kind: 'err', text: 'Give the animal a name.' });
    if (!httpsOk(f.image_url.trim())) return setMsg({ kind: 'err', text: 'The photo link must start with https://' });
    try {
      await upsert('animals', {
        id, name: f.name.trim(), sci: f.sci.trim(), local_name: f.local_name.trim(), kind: f.kind, group_text: f.group_text.trim(), status: f.status,
        danger: f.danger, endemic: !!f.endemic, size_label: f.size_label.trim(), image_url: f.image_url.trim(), credit: f.credit.trim(), description: f.description.trim(), facts: f.facts.trim(),
        published: !!f.published, sort_order: Number(f.sort_order) || 0, updated_at: new Date().toISOString()
      });
      setF((p) => ({ ...p, id, isNew: false }));
      setMsg({ kind: 'ok', text: f.published ? 'Saved. It shows in the species guide and on the Learn page.' : 'Saved as hidden.' });
      onSaved();
    } catch (x) { setMsg({ kind: 'err', text: x.message }); }
  };
  const del = async () => {
    if (!window.confirm(`Delete "${f.name || 'this animal'}"? This cannot be undone.`)) return;
    try { if (!animal.isNew) await remove('animals', 'id', f.id); onDeleted(); } catch (x) { setMsg({ kind: 'err', text: x.message }); }
  };
  return (
    <div className="adm-card">
      <div className="adm-grid">
        <label>Name<input value={f.name} onChange={set('name')} placeholder="Sri Lankan green pit viper" /></label>
        <label>Scientific name<input value={f.sci} onChange={set('sci')} placeholder="Craspedocephalus trigonocephalus" /></label>
        <label>Sinhala name<input value={f.local_name} onChange={set('local_name')} /></label>
        <label>Group<select value={f.kind} onChange={set('kind')}>{KINDS.map((k) => <option key={k}>{k}</option>)}</select></label>
        <label>Family line<input value={f.group_text} onChange={set('group_text')} placeholder="Snake · Viperidae · Pit vipers" /></label>
        <label>Conservation status<select value={f.status} onChange={set('status')}>{STATUSES.map((k) => <option key={k} value={k}>{k || 'Not assessed / unknown'}</option>)}</select></label>
        <label>Danger to people<select value={f.danger} onChange={set('danger')}><option value="">Not stated (frogs, lizards…)</option><option value="venomous">Venomous</option><option value="harmless">Harmless</option></select></label>
        <label>Size<input value={f.size_label} onChange={set('size_label')} placeholder="up to 130 cm" /></label>
        <label className="adm-wide">Photo<input type="file" accept="image/jpeg,image/png,image/webp" onChange={pick} disabled={busy} /><small>Upload a JPG, PNG or WebP up to 3 MB. It is stored in the database storage. Or paste a link below.</small></label>
        {f.image_url && <div className="adm-wide adm-preview"><img src={f.image_url} alt="" /></div>}
        <label className="adm-wide">Photo link<input type="url" value={f.image_url} onChange={set('image_url')} placeholder="https://…" /><small>https only. Filled in automatically after an upload.</small></label>
        <label className="adm-wide">Photo credit<input value={f.credit} onChange={set('credit')} placeholder="Photo: Name, with permission" /><small>Shown under the picture. Only use photos you have permission to show.</small></label>
        <label className="adm-wide">Description<textarea rows={4} value={f.description} onChange={set('description')} /></label>
        <label className="adm-wide">Key facts<textarea rows={5} value={f.facts} onChange={set('facts')} placeholder={'Habitat: Wet-zone forest\nDiet: Frogs and lizards'} /><small>One fact per line as "Label: text".</small></label>
        <label>Order<input type="number" value={f.sort_order} onChange={set('sort_order')} /></label>
        <label className="adm-check"><input type="checkbox" checked={f.endemic} onChange={set('endemic')} /> Found only in Sri Lanka (shown on Learn)</label>
        <label className="adm-check"><input type="checkbox" checked={f.published} onChange={set('published')} /> Show on the website</label>
      </div>
      <div className="adm-row">
        <button className="adm-btn adm-primary" onClick={save}>Save</button>
        <button className="adm-btn adm-danger" onClick={del}>Delete</button>
        <Msg kind={msg.kind}>{msg.text}</Msg>
      </div>
    </div>
  );
}

const factsText = (facts) => (facts || []).map(([a, b]) => `${a}: ${b}`).join('\n');
const absUrl = (u) => (u && u.startsWith('/') ? window.location.origin + u : u && /^https:\/\//i.test(u) ? u : '');

/** Copies the built-in species into the database so their text, photo and credit can be edited here. */
function ImportBuiltins({ existing, onDone }) {
  const [msg, setMsg] = useState({ kind: 'ok', text: '' });
  const [busy, setBusy] = useState(false);
  const have = new Set(existing.map((a) => a.name));
  const todo = SPECIES.filter((s) => !s.remote && !have.has(s.name));
  if (!todo.length) return null;
  const run = async () => {
    setBusy(true);
    try {
      await upsert('animals', todo.map((s, i) => ({
        id: slugOf(s.name), name: s.name, sci: s.sci || '', local_name: s.local || '', kind: s.kind, group_text: s.group || '', status: s.status || '',
        danger: s.venom ? 'venomous' : s.harmless ? 'harmless' : '', endemic: s.endemic !== false, size_label: s.sizeLabel || '', image_url: absUrl(s.img),
        credit: s.credit || '', description: s.desc || '', facts: factsText(s.facts), published: true, sort_order: i + 1, updated_at: new Date().toISOString()
      })));
      setMsg({ kind: 'ok', text: `Imported ${todo.length} animals. Edit them below.` });
      onDone();
    } catch (x) { setMsg({ kind: 'err', text: x.message }); } finally { setBusy(false); }
  };
  return (
    <div className="adm-card adm-help">
      <strong>Built-in species ({todo.length} not in the database yet)</strong>
      <p className="adm-hint">Copy the species that came with the website into the database. You can then change their text, photo and credit here, or hide them. Their "Don't confuse with" comparisons stay as they are.</p>
      <div className="adm-row"><button className="adm-btn adm-primary" onClick={run} disabled={busy}>{busy ? 'Importing…' : 'Import built-in species'}</button><Msg kind={msg.kind}>{msg.text}</Msg></div>
    </div>
  );
}

/** Copies animal photos that live on other websites (Wikimedia Commons, the site's own files) into the database storage. */
function SavePhotos({ rows, onDone }) {
  const [msg, setMsg] = useState({ kind: 'ok', text: '' });
  const [busy, setBusy] = useState(false);
  const base = import.meta.env.VITE_SUPABASE_URL + '/storage/v1/object/public/animal-photos/';
  const todo = rows.filter((a) => !(a.image_url || '').startsWith(base));
  if (!todo.length) return null;

  const wikiFile = async (sp) => {
    if (sp.file) return sp.file;
    if (!sp.wiki) return '';
    const j = await fetch('https://en.wikipedia.org/api/rest_v1/page/summary/' + sp.wiki).then((r) => r.json());
    const src = (j.originalimage && j.originalimage.source) || (j.thumbnail && j.thumbnail.source);
    if (!src) return '';
    const parts = src.split('?')[0].split('/');
    return decodeURIComponent(src.includes('/thumb/') ? parts[parts.length - 2] : parts[parts.length - 1]);
  };

  const run = async () => {
    setBusy(true);
    let ok = 0;
    const failed = [];
    for (const a of todo) {
      try {
        const sp = SPECIES.find((x) => x.name === a.name) || {};
        let from = a.image_url;
        let credit = a.credit;
        if (!from) {
          const f = await wikiFile(sp);
          if (!f) throw new Error('no photo found');
          from = FP(f) + '?width=1400';
          if (!credit) credit = 'Photo: Wikimedia Commons · https://commons.wikimedia.org/wiki/File:' + encodeURIComponent(f.replace(/ /g, '_'));
        }
        const blob = await fetch(from).then((r) => { if (!r.ok) throw new Error('download failed'); return r.blob(); });
        const type = blob.type === 'image/png' || blob.type === 'image/webp' ? blob.type : 'image/jpeg';
        const url = await uploadPhoto(new File([blob], 'photo', { type }), a.id);
        await upsert('animals', { ...a, image_url: url, credit, updated_at: new Date().toISOString() });
        ok += 1;
        setMsg({ kind: 'ok', text: `Saved ${ok} of ${todo.length}…` });
      } catch (x) { failed.push(a.name + ' (' + x.message + ')'); }
    }
    setMsg({ kind: failed.length ? 'err' : 'ok', text: `Saved ${ok} photos to storage.` + (failed.length ? ' Not saved: ' + failed.join(', ') : '') });
    setBusy(false);
    onDone();
  };
  return (
    <div className="adm-card adm-help">
      <strong>Web photos ({todo.length} not in database storage yet)</strong>
      <p className="adm-hint">Downloads each animal's photo from the website it comes from (Wikimedia Commons, or the site's own files), saves a copy in the database storage and points the animal to it. Animals with no photo get the lead photo of their Wikipedia article, credited to Wikimedia Commons with a link to the file page. Check each photo's licence there.</p>
      <div className="adm-row"><button className="adm-btn adm-primary" onClick={run} disabled={busy}>{busy ? 'Saving…' : 'Save web photos to database'}</button><Msg kind={msg.kind}>{msg.text}</Msg></div>
    </div>
  );
}

function Animals() {
  const [st, reload] = useAsync(() => list('animals', '&order=sort_order.asc,name.asc'), []);
  const [extra, setExtra] = useState([]);
  const rows = st.data || [];
  return (
    <>
      <div className="adm-head"><h2>Animals</h2><button className="adm-btn" onClick={() => setExtra((x) => [{ ...blankAnimal(), key: Date.now() }, ...x])}>+ Add animal</button></div>
      <ImportBuiltins existing={rows} onDone={reload} />
      <SavePhotos rows={rows} onDone={reload} />
      <p className="adm-hint">Animals added here are shown after the built-in ones in the species guide on the home page, and on the Learn page when "Found only in Sri Lanka" is ticked. Visitors see changes the next time they open the site.</p>
      <Msg kind="err">{st.error}</Msg>
      {st.loading && <p className="adm-hint">Loading…</p>}
      {extra.map((a) => <AnimalCard key={a.key} animal={a} onSaved={() => { setExtra((x) => x.filter((e) => e.key !== a.key)); reload(); }} onDeleted={() => setExtra((x) => x.filter((e) => e.key !== a.key))} />)}
      {rows.map((a) => <AnimalCard key={a.id + a.updated_at} animal={a} onSaved={reload} onDeleted={reload} />)}
      {!st.loading && !st.error && !rows.length && !extra.length && <p className="adm-hint">No animals added yet. The built-in species still show.</p>}
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
    <div className="adm-card">
      <div className="adm-head"><strong>/{slug}</strong><a className="adm-link" href={'/' + slug} target="_blank" rel="noopener noreferrer">View page ↗</a></div>
      <div className="adm-grid">
        <label>Title<input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></label>
        <label>Last updated<input value={f.updated} onChange={(e) => setF({ ...f, updated: e.target.value })} /></label>
        <label className="adm-wide">Short intro<input value={f.lead} onChange={(e) => setF({ ...f, lead: e.target.value })} /></label>
        <label className="adm-wide">Content<textarea rows={16} value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} /><small>Start each section with "## Heading". Separate paragraphs with a blank line.</small></label>
      </div>
      <div className="adm-row">
        <button className="adm-btn adm-primary" onClick={save}>Save</button>
        {saved && <button className="adm-btn" onClick={reset}>Reset to original</button>}
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
      <p className="adm-hint">The text shown here is what the page currently says. Edit and save to publish your version.</p>
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
      <div className="adm-head"><h2>{title} <span className="adm-count">{rows.length}</span></h2>
        <button className="adm-btn" disabled={!rows.length} onClick={() => download(csvName + '-' + new Date().toISOString().slice(0, 10) + '.csv', toCsv(shown))}>Download CSV{q ? ' (filtered)' : ''}</button></div>
      <input className="adm-search" type="search" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
      <Msg kind="err">{st.error}</Msg>
      {st.loading && <p className="adm-hint">Loading…</p>}
      {!st.loading && !st.error && !rows.length && <p className="adm-hint">Nothing here yet.</p>}
      {shown.length > 0 && (
        <div className="adm-tablewrap">
          <table>
            <thead><tr>{cols.map((c) => <th key={c}>{pretty(c)}</th>)}<th /></tr></thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r[idCol] || JSON.stringify(r)}>
                  {cols.map((c) => <td key={c}>{shorten(r[c])}</td>)}
                  <td className="adm-actions"><button className="adm-btn adm-sm" onClick={() => setOpen(r)}>View</button>{canDelete && <button className="adm-btn adm-sm adm-danger" onClick={() => del(r)}>Delete</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {open && (
        <div className="adm-modal" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) setOpen(null); }}>
          <div className="adm-card adm-modalbox">
            <div className="adm-head"><strong>Record details</strong><button className="adm-btn adm-sm" onClick={() => setOpen(null)}>Close</button></div>
            <dl>{Object.entries(open).map(([k, v]) => <div key={k}><dt>{pretty(k)}</dt><dd>{v === null || v === '' ? '—' : typeof v === 'object' ? JSON.stringify(v) : String(v)}</dd></div>)}</dl>
          </div>
        </div>
      )}
    </>
  );
}

/* ---------------------------------------------------------------- shell */
export default function Admin() {
  const [state, setState] = useState(hasSession() ? (needsPassword() ? 'setpw' : 'checking') : 'out');
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

  if (!configured()) return <div className="adm-login"><div className="adm-card"><h1>Database not configured</h1><p>Set VITE_SUPABASE_URL and VITE_SUPABASE_KEY (see .env.example).</p></div></div>;
  if (state === 'checking') return <div className="adm-login"><p className="adm-hint">Checking sign-in…</p></div>;
  if (state === 'setpw') return <SetPassword onDone={() => setState('checking')} />;
  if (state === 'out') return <Login onDone={() => setState('in')} />;

  const out = async () => { await signOut(); setState('out'); };
  return (
    <div className="adm-shell">
      <aside className="adm-side">
        <span className="adm-brand">SLYHS admin</span>
        <nav aria-label="Admin sections">
          {TABS.map(([k, label]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{label}</button>)}
        </nav>
        <div className="adm-who"><span>{sessionEmail()}</span><button className="adm-btn adm-sm" onClick={out}>Sign out</button><a className="adm-link" href="/">View website ↗</a></div>
      </aside>
      <main className="adm-main">
        {tab === 'overview' && <Overview go={setTab} />}
        {tab === 'events' && <Events />}
        {tab === 'settings' && <Settings />}
        {tab === 'animals' && <Animals />}
        {tab === 'posts' && <Posts />}
        {tab === 'policies' && <Policies />}
        {tab === 'members' && <DataTable table="registrations" title="Members" idCol="id" csvName="slyhs-members" keyCols={['created_at', 'full_name', 'email', 'district', 'tier', 'phone', 'dob']} />}
        {tab === 'newsletter' && <DataTable table="newsletter_subscribers" title="Newsletter subscribers" idCol="id" csvName="slyhs-newsletter" keyCols={['created_at', 'email']} />}
      </main>
    </div>
  );
}
