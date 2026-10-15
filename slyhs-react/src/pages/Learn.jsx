import { Fragment, useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import SmartLink from '../components/SmartLink';
import AidModal from '../components/AidModal';
import { Footer } from '../components/Footer';
import useAnimals from '../lib/animals';
import { SPECIES, STATUS_C, AID_DO, AID_DONT } from './speciesData';
import useSpeciesPhotos, { speciesSlug } from '../lib/useSpeciesPhotos';
import { PEOPLE } from './peopleData';

// Group descriptions stay general; the specific facts come from the species guide data.
const GROUPS = [
  ['Snakes', 'Over 100 species share the island, but only about five can cause a fatal bite. Learning to tell them apart is the best way to stay safe and to stop harmless snakes being killed.'],
  ['Frogs', 'Sri Lanka has 116 recognised amphibian species and about 90% are found nowhere else on Earth. Many live in wet-zone streams and forest leaf litter.'],
  ['Lizards', 'From horned montane lizards to the green hump-nosed lizard, many of our agamids are found only in Sri Lanka.'],
  ['Turtles', 'Freshwater turtles such as the Sri Lankan flapshell turtle live in tanks, rivers and lakes across the island.']
];

const FACTS = [
  ['116', 'recognised amphibian species in Sri Lanka', 'AmphibiaWeb', 'https://amphibiaweb.org'],
  ['72%', 'of those amphibian species are threatened with extinction', 'IUCN Red List', 'https://www.iucnredlist.org'],
  ['100+', 'snake species, but only about five can cause a fatal bite', 'Reptile Database', 'https://reptile-database.reptarium.cz']
];

const WHY = [
  ['An island apart', 'Sri Lanka has been separated from India by shallow sea. Animals that settled here evolved on their own, so many species exist nowhere else.'],
  ['Many habitats in a small space', 'Rainforest, dry-zone forest, grassland, wetlands and cool mountain forest all sit within a few hours of each other, and each holds different species.'],
  ['Small ranges, big risk', 'Many endemic species live in one small patch of forest or one mountain. If that habitat is cleared or polluted, the species has nowhere else to go.']
];

const ENDEMIC = SPECIES.filter((s) => s.endemic !== false);
// animals added in the admin panel arrive after the first render: refill the list in place
function useEndemic() {
  useAnimals();
  ENDEMIC.splice(0, ENDEMIC.length, ...SPECIES.filter((s) => s.endemic !== false));
}
const FILTERS = ['All', 'Snakes', 'Frogs', 'Lizards', 'Turtles'];

/* ---------------------------------------------------------------- list page */
function LearnHome() {
  const [kind, setKind] = useState('All');
  const [aid, setAid] = useState(false);
  const navigate = useNavigate();
  const photo = useSpeciesPhotos(ENDEMIC);
  const shown = ENDEMIC.filter((s) => kind === 'All' || s.kind === kind);

  return (
    <main className="page-learn">
      <section className="learn-hero">
        <span className="eyebrow">Learn</span>
        <h1 className="blog-title">Sri Lanka's reptiles and amphibians, <span className="serif">found nowhere else.</span></h1>
        <p className="blog-lead">A short guide to the island's endemic herps: what they are, why there are so many, how to tell them apart and how to stay safe around them.</p>
        <div className="learn-cta">
          <SmartLink to="/#species" className="btn btn-primary">Open the species guide</SmartLink>
          <button type="button" className="btn btn-ghost glass" onClick={() => setAid(true)}>Snakebite first-aid guide</button>
        </div>
      </section>

      <section className="learn-facts">
        {FACTS.map(([n, t, src, url]) => (
          <div key={src} className="glass-card learn-fact">
            <b>{n}</b><p>{t}</p>
            <a href={url} target="_blank" rel="noopener noreferrer">Source: {src} ↗</a>
          </div>
        ))}
      </section>

      <section className="learn-block">
        <h2>Why so many species live only here</h2>
        <div className="learn-why">
          {WHY.map(([h, t]) => <div key={h}><h3>{h}</h3><p>{t}</p></div>)}
        </div>
      </section>

      <section className="learn-block">
        <h2>The four groups</h2>
        <div className="learn-groups">
          {GROUPS.map(([h, t]) => <div key={h} className="glass-card"><h3>{h}</h3><p>{t}</p></div>)}
        </div>
      </section>

      <section className="learn-block" id="species-cards">
        <h2>Endemic species to know</h2>
        <p className="learn-sub">Found only in Sri Lanka. Open a card for the full story. {ENDEMIC.length} species so far.</p>
        <div className="sp-chips" role="group" aria-label="Filter endemic species">
          {FILTERS.map((k) => <button type="button" key={k} className={'sp-chip' + (k === kind ? ' on' : '')} onClick={() => setKind(k)}>{k}</button>)}
        </div>
        <div className="learn-cards">
          {shown.map((s) => {
            const img = photo(s, 800);
            return (
              <button type="button" key={s.name} className="learn-card" onClick={() => navigate('/learn/' + speciesSlug(s.name))} aria-label={`${s.name}: read more`}>
                <span className="learn-card-img" style={img ? { backgroundImage: `url("${img}")`, backgroundPosition: s.pos } : undefined} />
                <span className="learn-card-shade" aria-hidden="true" />
                <span className="learn-card-top">
                  <span className="tag tag-endemic">Endemic</span>
                  {s.venom && <span className="tag tag-venom">Venomous</span>}
                </span>
                <span className="learn-card-text">
                  <em>{s.kind.replace(/s$/, '')}{s.status ? ' · ' + s.status : ''}</em>
                  <strong>{s.name}</strong>
                  <i>{s.sci}</i>
                  <span className="learn-card-more">Read more →</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="learn-block" id="herpetologists">
        <h2>The people who built Sri Lankan herpetology</h2>
        <p className="learn-sub">From the first catalogues in the 1850s to today's taxonomists. Facts are taken from the linked sources.</p>
        <div className="people">
          {PEOPLE.map((p) => (
            <article key={p.name} className="person glass-card">
              <div className="person-photo">
                {p.photo ? <img src={p.photo} alt={p.name} loading="lazy" /> : <span aria-hidden="true">{p.initials}</span>}
              </div>
              <div className="person-body">
                <span className="person-era">{p.era}</span>
                <h3>{p.name}</h3>
                <span className="person-years">{p.years} · {p.role}</span>
                <ul>{p.facts.map((f) => <li key={f}>{f}</li>)}</ul>
                <div className="person-links">
                  {p.sources.map(([l, u]) => <a key={u} href={u} target="_blank" rel="noopener noreferrer">{l} ↗</a>)}
                  {p.photoLink && <a href={p.photoLink} target="_blank" rel="noopener noreferrer">Photo: {p.photoCredit} ↗</a>}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="learn-block learn-rules">
        <h2>Look, photograph, record. <span className="serif">Never handle.</span></h2>
        <ul>
          <li>Keep your distance from every snake. Many are harmless, but never assume.</li>
          <li>Do not catch, chase or kill wildlife. Rat snakes are often killed by mistake because they look like cobras.</li>
          <li>Do not share the exact location of rare species.</li>
          <li>If someone is bitten: keep them still and calm, and get to hospital fast.</li>
        </ul>
        <div className="learn-cta">
          <button type="button" className="btn btn-outline" onClick={() => setAid(true)}>Read the first-aid guide</button>
          <SmartLink to="/ethics" className="btn btn-outline">Code of Ethics</SmartLink>
          <SmartLink to="/join" className="btn btn-primary">Join the society →</SmartLink>
        </div>
      </section>

      <Footer />
      <AidModal open={aid} onClose={() => setAid(false)} onIdentify={() => { setAid(false); navigate('/#species'); }} />
    </main>
  );
}

/* ---------------------------------------------------------------- one species, full page */
function SpeciesPage({ idx }) {
  const navigate = useNavigate();
  const [aid, setAid] = useState(false);
  const photo = useSpeciesPhotos(ENDEMIC);
  const s = ENDEMIC[idx];
  const prev = ENDEMIC[(idx - 1 + ENDEMIC.length) % ENDEMIC.length];
  const next = ENDEMIC[(idx + 1) % ENDEMIC.length];
  const img = photo(s, 1600);
  const sc = STATUS_C[s.status];
  const sz = s.sizeCm;
  const ref = sz ? (sz <= 25 ? [18, 'Adult hand', '18 cm'] : [170, 'Adult person', '1.7 m']) : null;
  const mx = sz ? Math.max(sz, ref[0]) : 1;
  const look = s.look;
  const lookTarget = look && look.target ? ENDEMIC.find((x) => x.name === look.target) : null;
  const go = (x) => navigate('/learn/' + speciesSlug(x.name));

  // left / right arrow keys step through the species
  useEffect(() => {
    const onKey = (e) => {
      if (aid || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const tag = e.target && e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target && e.target.isContentEditable)) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(prev); } else if (e.key === 'ArrowRight') { e.preventDefault(); go(next); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <main className="page-learn page-species">
      <article className="spage">
        <SmartLink to="/learn" className="policy-back">← All endemic species</SmartLink>

        <header className="spage-hero">
          <div className="spage-photo" role="img" aria-label={`${s.name} (${s.sci})`} style={img ? { backgroundImage: `url("${img}")`, backgroundPosition: s.pos } : undefined}>
            <span className="spage-count">{String(idx + 1).padStart(2, '0')} / {String(ENDEMIC.length).padStart(2, '0')}</span>
            {!s.img && <span className="spage-credit">Photo: Wikimedia Commons</span>}
          </div>
          <div className="spage-title">
            <span className="sp-group">{s.group}</span>
            <h1>{s.name}</h1>
            <span className="sp-latin">{s.sci}</span>
            {s.syn && <span className="sp-syn">{s.syn}</span>}
            {s.local && <span className="spage-local">{s.local}</span>}
            <div className="sp-tags">
              <span className="tag tag-endemic">Endemic to Sri Lanka</span>
              {s.harmless && <span className="tag tag-safe">Non-venomous</span>}
              {s.status && <span className="tag" style={{ borderColor: sc[0], color: sc[1] }}>IUCN · {s.status}</span>}
              {s.venom && <span className="tag tag-venom">Venomous</span>}
            </div>
          </div>
        </header>

        <div className="spage-body">
          <section>
            <h2>About</h2>
            <p className="spage-desc">{s.desc}</p>
          </section>

          <section>
            <h2>Key facts</h2>
            <dl className="spage-facts">
              {s.facts.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
            </dl>
          </section>

          {sz && (
            <section className="sp-box">
              <span className="sp-label">Size check</span>
              <div className="sp-size">
                <span>This species</span>
                <span className="bar"><span style={{ width: Math.max(2, sz / mx * 100) + '%' }} /></span>
                <span className="val">{s.sizeLabel}</span>
                <span className="dim">{ref[1]}</span>
                <span className="bar"><span className="ref" style={{ width: ref[0] / mx * 100 + '%' }} /></span>
                <span className="dim">{ref[2]}</span>
              </div>
            </section>
          )}

          {look && (
            <section className="sp-box sp-look">
              <div className="sp-boxhead">
                <span className="sp-label">Don't confuse with</span>
                {lookTarget && <button type="button" className="sp-link" onClick={() => go(lookTarget)}>View {look.name} →</button>}
              </div>
              <div className="sp-lookgrid">
                <strong>{s.name}</strong><strong>{look.name}</strong>
                {look.rows.map(([a, b]) => <Fragment key={a}><span>{a}</span><span>{b}</span></Fragment>)}
              </div>
              <span className="sp-warn">If you are not sure, treat it as venomous.</span>
            </section>
          )}

          {s.venom && (
            <section className="sp-box sp-bite" role="note">
              <div className="sp-boxhead">
                <span className="sp-biteL"><span className="sp-label">If someone is bitten</span><button type="button" onClick={() => setAid(true)}>Full guide →</button></span>
                <a href="tel:1990" className="sp-call">Call 1990 · Suwa Seriya</a>
              </div>
              <div className="sp-dodont">
                <ul>{AID_DO.map((d) => <li key={d}><span className="y">✓</span>{d}</li>)}</ul>
                <ul>{AID_DONT.map((d) => <li key={d}><span className="n">✕</span>{d}</li>)}</ul>
              </div>
            </section>
          )}

          <p className="spage-rule">Look, photograph, record. Never handle.</p>
        </div>

        <nav className="spage-nav" aria-label="More species">
          <button type="button" onClick={() => go(prev)}><span>← Previous</span><strong>{prev.name}</strong></button>
          <button type="button" onClick={() => go(next)}><span>Next →</span><strong>{next.name}</strong></button>
        </nav>
      </article>
      <Footer />
      <AidModal open={aid} onClose={() => setAid(false)} onIdentify={() => { setAid(false); navigate('/#species'); }} />
    </main>
  );
}

export default function Learn() {
  const { species } = useParams();
  useEndemic();
  if (!species) return <LearnHome />;
  const idx = ENDEMIC.findIndex((s) => speciesSlug(s.name) === species);
  return idx < 0 ? <Navigate to="/learn" replace /> : <SpeciesPage key={species} idx={idx} />;
}
