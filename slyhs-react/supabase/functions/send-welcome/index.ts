import { createClient } from 'jsr:@supabase/supabase-js@2';

// Sends the welcome email for one registration (English).
// Called by a database trigger right after the registration is saved.
// Safe to call twice: the first call claims the row, so a repeat never sends a second email.
// The footer (society name, contact person, links) reads the site settings edited in the admin panel.

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_KEY = Deno.env.get('RESEND_API_KEY');
const MAIL_FROM = Deno.env.get('MAIL_FROM') ?? 'SLYHS <onboarding@resend.dev>';
const MAIL_REPLY_TO = Deno.env.get('MAIL_REPLY_TO') ?? '';
const SITE_URL = (Deno.env.get('SITE_URL') ?? 'https://slyhs-web.vercel.app').replace(/\/+$/, '');

// Welcome emails are sent in English only.
type Lang = 'English';

const TEXT: Record<Lang, { subject: (n: string) => string; hello: (n: string) => string; thanks: string; tier: string; next: string; nextBody: string; safe: string; sign: string }> = {
  English: {
    subject: (n) => `Welcome to SLYHS, ${n}!`,
    hello: (n) => `Welcome, ${n}!`,
    thanks: "Thank you for registering with the Sri Lankan Young Herpetologists' Society. We're glad you're here.",
    tier: 'You are joining as',
    next: 'What happens next',
    nextBody: 'Our first online meeting is planned for November 2026 (date to be confirmed). We will email you the details, and your district WhatsApp group link if you asked for one.',
    safe: 'Your details are used only for society communication. We never share the locations of rare species. You can leave at any time by replying to this email.',
    sign: 'The SLYHS committee'
  }
};

// footer wording
const FOOT: Record<Lang, { society: string; contact: string; phone: string; email: string; explore: string; links: [string, string][]; note: string }> = {
  English: {
    society: "Sri Lankan Young Herpetologists' Society", contact: 'Contact', phone: 'Phone', email: 'Email', explore: 'Explore',
    links: [['Website', ''], ['Learn', '/learn'], ['Join', '/join'], ['Contact', '/contact'], ['Privacy', '/privacy']],
    note: 'You received this email because you registered at the SLYHS website. Study, protect and share Sri Lanka’s reptiles and amphibians.'
  }
};

type Settings = Record<string, string>;

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const httpsOnly = (u?: string) => (u && /^https:\/\//i.test(u.trim()) ? u.trim() : '');

/** 0716345560 -> +94 (71) 634 5560, same as the website. */
function fmtPhone(p: string) {
  const d = p.replace(/\D/g, '');
  const m = d.match(/^(?:94|0)?(\d{2})(\d{3})(\d{4})$/);
  return m ? { shown: `+94 (${m[1]}) ${m[2]} ${m[3]}`, href: `+94${m[1]}${m[2]}${m[3]}` } : { shown: p, href: p.replace(/[^\d+]/g, '') };
}

const F = 'Segoe UI,Helvetica,Arial,sans-serif';

function footerHtml(lang: Lang, s: Settings) {
  const f = FOOT[lang];
  const name = (s.proposer_name || '').trim();
  const phone = s.proposer_phone ? fmtPhone(s.proposer_phone.trim()) : null;
  const mail = [s.contact_email, s.proposer_email].map((e) => (e || '').trim()).find((e) => /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(e)) || '';
  const socials = [['Facebook', s.facebook_url], ['Instagram', s.instagram_url], ['YouTube', s.youtube_url], ['WhatsApp', s.whatsapp_url]]
    .map(([n, u]) => [n, httpsOnly(u)] as [string, string]).filter(([, u]) => u);

  const links = f.links.map(([label, path]) => `<a href="${esc(SITE_URL + path)}" style="color:#D4F27C;text-decoration:none">${esc(label)}</a>`).join('<span style="color:#3A4A3A"> &nbsp;·&nbsp; </span>');
  const socialRow = socials.length
    ? `<p style="margin:12px 0 0;font:13px/1.6 ${F}">${socials.map(([n, u]) => `<a href="${esc(u)}" style="color:#8FA188;text-decoration:underline">${esc(n)}</a>`).join('<span style="color:#3A4A3A"> &nbsp;·&nbsp; </span>')}</p>`
    : '';
  const contactRows = [
    name ? `<tr><td style="padding:0 0 4px;font:600 14px/1.4 ${F};color:#EEF2EA">${esc(name)}</td></tr>` : '',
    phone ? `<tr><td style="padding:0 0 2px;font:13px/1.5 ${F};color:#8FA188">${esc(f.phone)}: <a href="tel:${esc(phone.href)}" style="color:#D4F27C;text-decoration:none">${esc(phone.shown)}</a></td></tr>` : '',
    mail ? `<tr><td style="padding:0;font:13px/1.5 ${F};color:#8FA188">${esc(f.email)}: <a href="mailto:${esc(mail)}" style="color:#D4F27C;text-decoration:none">${esc(mail)}</a></td></tr>` : ''
  ].join('');

  return `
      <tr><td style="padding:30px 32px 0"><div style="height:1px;background:linear-gradient(90deg,#C9EE6E,#1E2A1F 60%)"></div></td></tr>
      <tr><td style="padding:22px 32px 0">
        <span style="display:inline-block;padding:8px 11px;border-radius:11px 3px 11px 3px;background:#C9EE6E;color:#07100B;font:700 13px ${F}">SL</span>
        <span style="margin-left:10px;font:600 14px ${F};letter-spacing:.22em;color:#EEF2EA;vertical-align:middle">SLYHS</span>
        <p style="margin:12px 0 0;font:italic 400 18px/1.3 Georgia,serif;color:#D4F27C">${esc(f.society)}</p>
      </td></tr>
      ${contactRows ? `<tr><td style="padding:18px 32px 0"><p style="margin:0 0 8px;font:11px/1.4 ${F};letter-spacing:.16em;text-transform:uppercase;color:#6C7B66">${esc(f.contact)}</p><table role="presentation" cellpadding="0" cellspacing="0">${contactRows}</table></td></tr>` : ''}
      <tr><td style="padding:18px 32px 0">
        <p style="margin:0;font:13px/1.6 ${F}">${links}</p>
        ${socialRow}
      </td></tr>
      <tr><td style="padding:20px 32px 30px"><p style="margin:0;font:11.5px/1.6 ${F};color:#6C7B66">${esc(f.note)}</p></td></tr>`;
}

function buildEmail(row: { full_name: string; preferred_name: string | null; preferred_languages: string[]; tier: string }, settings: Settings) {
  const name = (row.preferred_name || row.full_name.split(' ')[0] || 'friend').trim();
  const order: Lang[] = ['English'];
  const primary: Lang = 'English';

  const sections = order.map((l) => {
    const t = TEXT[l];
    return `
      <tr><td style="padding:28px 32px 0">
        <h1 style="margin:0 0 14px;font:600 26px/1.2 ${F};color:#EEF2EA">${esc(t.hello(name))}</h1>
        <p style="margin:0 0 18px;font:300 16px/1.6 ${F};color:#C9D1C4">${esc(t.thanks)}</p>
        <p style="margin:0 0 6px;font:12px/1.4 ${F};letter-spacing:.16em;text-transform:uppercase;color:#8FA188">${esc(t.tier)}</p>
        <p style="margin:0 0 20px;font:italic 400 30px/1.1 Georgia,serif;color:#D4F27C">${esc(row.tier)}</p>
        <p style="margin:0 0 6px;font:600 15px/1.4 ${F};color:#EEF2EA">${esc(t.next)}</p>
        <p style="margin:0 0 18px;font:300 15px/1.6 ${F};color:#C9D1C4">${esc(t.nextBody)}</p>
        <p style="margin:0 0 4px;font:300 13px/1.6 ${F};color:#8FA188">${esc(t.safe)}</p>
        <p style="margin:14px 0 0;font:500 14px/1.4 ${F};color:#EEF2EA">${esc(t.sign)}</p>
      </td></tr>
      ${order.length > 1 ? '<tr><td style="padding:24px 32px 0"><div style="height:1px;background:#1E2A1F"></div></td></tr>' : ''}`;
  }).join('');

  const html = `<!doctype html><html><body style="margin:0;padding:24px 12px;background:#050806">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#0B120C;border:1px solid #1E2A1F;border-radius:22px">
      <tr><td style="padding:28px 32px 0">
        <span style="display:inline-block;padding:9px 12px;border-radius:12px 3px 12px 3px;background:#C9EE6E;color:#07100B;font:700 14px ${F}">SL</span>
        <span style="margin-left:10px;font:600 15px ${F};letter-spacing:.22em;color:#EEF2EA">SLYHS</span>
      </td></tr>
      ${sections}
      ${footerHtml(primary, settings)}
    </table>
  </td></tr></table></body></html>`;

  const f = FOOT[primary];
  const phone = settings.proposer_phone ? fmtPhone(settings.proposer_phone.trim()) : null;
  const footText = [f.society, [settings.proposer_name, phone && phone.shown, settings.proposer_email].filter(Boolean).join(' · '), SITE_URL].filter(Boolean).join('\n');
  const text = order.map((l) => {
    const t = TEXT[l];
    return `${t.hello(name)}\n\n${t.thanks}\n\n${t.tier}: ${row.tier}\n\n${t.next}\n${t.nextBody}\n\n${t.safe}\n\n${t.sign}`;
  }).join('\n\n------------------------------\n\n') + `\n\n--\n${footText}`;

  return { subject: TEXT[primary].subject(name), html, text };
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  let id: string | undefined;
  try { ({ id } = await req.json()); } catch { /* handled below */ }
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return Response.json({ ok: false, error: 'bad_request' }, { status: 400 });

  const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  // claim the row so a repeat call can never send a second email
  const { data: row, error: claimErr } = await db
    .from('registrations')
    .update({ welcome_sent_at: new Date().toISOString(), email_error: null })
    .eq('id', id)
    .is('welcome_sent_at', null)
    .select('email, full_name, preferred_name, preferred_languages, tier')
    .maybeSingle();
  if (claimErr) return Response.json({ ok: false, error: 'db' }, { status: 500 });
  if (!row) return Response.json({ ok: true, skipped: true });

  const release = (reason: string) =>
    db.from('registrations').update({ welcome_sent_at: null, email_error: reason.slice(0, 300) }).eq('id', id);

  if (!RESEND_KEY) {
    await release('RESEND_API_KEY is not set');
    return Response.json({ ok: false, error: 'not_configured' }, { status: 503 });
  }

  // contact details and social links come from the admin panel; the email still sends without them
  const settings: Settings = {};
  try {
    const { data } = await db.from('site_settings').select('key, value');
    (data ?? []).forEach((r: { key: string; value: string }) => { settings[r.key] = r.value; });
  } catch { /* table missing: send without the contact block */ }

  const mail = buildEmail(row, settings);
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: MAIL_FROM,
      headers: { 'X-Entity-Ref-ID': id },
      to: [row.email],
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      ...(MAIL_REPLY_TO ? { reply_to: MAIL_REPLY_TO } : {})
    })
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    await release(`resend ${res.status}: ${detail}`);
    return Response.json({ ok: false, error: 'send_failed' }, { status: 502 });
  }
  return Response.json({ ok: true });
});
