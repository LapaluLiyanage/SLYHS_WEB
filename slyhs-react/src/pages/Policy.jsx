import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { getPolicies } from '../lib/api';
import { useSiteSettings, safeEmail } from '../lib/settings';
import SmartLink from '../components/SmartLink';
import { SlimFooter } from '../components/Footer';
import { POLICIES } from './policyData';

/** One page for the three society policies: /privacy, /ethics, /safeguarding. */
export default function Policy() {
  const { slug } = useParams();
  const [remote, setRemote] = useState(null);
  const site = useSiteSettings();
  useEffect(() => { let dead = false; getPolicies().then((r) => { if (r && !dead) setRemote(r); }); return () => { dead = true; }; }, []);
  const base = POLICIES[slug];
  if (!base) return <Navigate to="/" replace />;
  const r = remote && remote[slug];
  const p = r && r.title && Array.isArray(r.sections) && r.sections.length ? { ...base, ...r } : base;
  const mail = safeEmail(site.contact_email) || safeEmail(site.proposer_email);

  return (
    <main className="page-policy">
      <article className="policy">
        <SmartLink to="/" className="policy-back">← Back to home</SmartLink>
        <span className="eyebrow">Society policy</span>
        <h1 className="policy-title">{p.title}</h1>
        <p className="policy-meta">{p.updated ? `Last updated ${p.updated}` : 'Draft for the founding committee'}</p>
        <p className="policy-lead">{p.lead}</p>
        {p.sections.map(([h, items]) => (
          <section key={h}>
            <h2>{h}</h2>
            {items.map((t) => <p key={t}>{t}</p>)}
          </section>
        ))}
        <p className="policy-note">
          {mail ? <>Questions about this policy? Email <a href={'mailto:' + mail}>{mail}</a>.</> : null}{p === base ? ' This policy is a working draft and will be reviewed and confirmed by the committee once the society is formed.' : ''}
        </p>
        <nav className="policy-links" aria-label="Other policies">
          {Object.entries(POLICIES).filter(([k]) => k !== slug).map(([k, v]) => <SmartLink key={k} to={'/' + k}>{v.title} →</SmartLink>)}
        </nav>
      </article>
      <SlimFooter />
    </main>
  );
}
