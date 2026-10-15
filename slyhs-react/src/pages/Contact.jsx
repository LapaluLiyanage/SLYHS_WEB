import { useLang } from '../lib/i18n';
import { useSiteSettings, safeEmail, safePhone, safeUrl } from '../lib/settings';
import SmartLink from '../components/SmartLink';
import { Footer } from '../components/Footer';

const TEXT = {
  en: { eyebrow: 'Contact', h: ['Talk to the', 'proposer.'], lead: 'The society is being formed. Mithra Yohan Fernando, who proposed it, is the point of contact for members, mentors, schools and partners.', role: 'Proposer of the society', call: 'Call', email: 'Email', whatsapp: 'WhatsApp the community', phone: 'Phone', mail: 'Email', note: 'Replies may take a day or two. If you found a snake at home, call the rescue hotline from the home page instead.', join: 'Join the society' },
  si: { eyebrow: 'සම්බන්ධ වන්න', h: ['යෝජකයා සමඟ', 'කතා කරන්න.'], lead: 'සංගමය පිහිටුවමින් පවතී. එය යෝජනා කළ මිත්‍ර යොහාන් ප්‍රනාන්දු සාමාජිකයින්, උපදේශකයින්, පාසල් සහ හවුල්කරුවන් සඳහා සම්බන්ධතා පුද්ගලයා වේ.', role: 'සංගමයේ යෝජකයා', call: 'අමතන්න', email: 'විද්‍යුත් තැපෑල', whatsapp: 'WhatsApp ප්‍රජාවට', phone: 'දුරකථන', mail: 'විද්‍යුත් තැපෑල', note: 'පිළිතුරු ලබා දීමට දවසක් දෙකක් ගත විය හැක. ගෙදර සර්පයෙකු දුටුවොත්, මුල් පිටුවේ ඇති බේරාගැනීමේ අංකයට අමතන්න.', join: 'සංගමයට එක්වන්න' },
  ta: { eyebrow: 'தொடர்பு', h: ['முன்மொழிந்தவரிடம்', 'பேசுங்கள்.'], lead: 'சங்கம் உருவாக்கப்பட்டு வருகிறது. அதை முன்மொழிந்த மித்ர யோகன் பெர்னாண்டோ உறுப்பினர்கள், வழிகாட்டிகள், பள்ளிகள் மற்றும் பங்காளர்களுக்கான தொடர்பு நபர்.', role: 'சங்கத்தை முன்மொழிந்தவர்', call: 'அழைக்க', email: 'மின்னஞ்சல்', whatsapp: 'WhatsApp சமூகம்', phone: 'தொலைபேசி', mail: 'மின்னஞ்சல்', note: 'பதில் வர ஒரு நாள் அல்லது இரண்டு நாட்கள் ஆகலாம். வீட்டில் பாம்பைக் கண்டால், முகப்புப் பக்கத்திலுள்ள மீட்பு எண்ணை அழையுங்கள்.', join: 'சங்கத்தில் சேருங்கள்' }
};

/** Contact page: the proposer's photo and details. Name, phone and email come from the admin panel's site settings. */
export default function Contact() {
  const { lang } = useLang();
  const c = TEXT[lang] || TEXT.en;
  const site = useSiteSettings();
  const phone = safePhone(site.proposer_phone);
  const mail = safeEmail(site.proposer_email) || safeEmail(site.contact_email);
  const wa = safeUrl(site.whatsapp_url);

  return (
    <main className="page-contact">
      <section className="contact">
        <div className="contact-copy">
          <span className="eyebrow">{c.eyebrow}</span>
          <h1 className="blog-title">{c.h[0]} <span className="serif">{c.h[1]}</span></h1>
          <p className="blog-lead">{c.lead}</p>
          <div className="contact-card glass-card">
            <span className="contact-role">{c.role}</span>
            <h2>{site.proposer_name}</h2>
            <dl>
              {phone && <><dt>{c.phone}</dt><dd><a href={'tel:' + phone.replace(/[^\d+]/g, '')}>{phone}</a></dd></>}
              {mail && <><dt>{c.mail}</dt><dd><a href={'mailto:' + mail}>{mail}</a></dd></>}
            </dl>
            <div className="contact-actions">
              {phone && <a className="btn btn-primary" href={'tel:' + phone.replace(/[^\d+]/g, '')}>{c.call} →</a>}
              {mail && <a className="btn btn-outline" href={'mailto:' + mail}>{c.email}</a>}
              {wa && <a className="btn btn-outline" href={wa} target="_blank" rel="noopener noreferrer">{c.whatsapp} ↗</a>}
            </div>
          </div>
          <p className="contact-note">{c.note}</p>
          <SmartLink to="/join" className="link-arrow">{c.join} →</SmartLink>
        </div>
        <figure className="contact-photo">
          <img src="/assets/people/mithra-yohan-fernando.jpg" alt={site.proposer_name} width="900" height="1200" loading="eager" />
        </figure>
      </section>
      <Footer />
    </main>
  );
}
