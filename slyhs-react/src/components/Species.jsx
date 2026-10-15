import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { gsap, prefersReducedMotion } from '../lib/gsap';
import Split from './Split';
import SmartLink from './SmartLink';
import useAnimals from '../lib/animals';
import { FP, SPECIES, KINDS, VEN, STATUS_C } from '../pages/speciesData';

const SLIDE_SECONDS = 6;
const matchesVen = (s, v) => v === 'all' || (v === 'venomous') === !!s.venom;
const matchesKind = (s, k) => k === 'All' || s.kind === k;

/** "Meet the island's herps": filterable species rail + slideshow detail panel. */
export default function Species() {
  const animalsVer = useAnimals(); // animals added in the admin panel are appended to SPECIES
  const [sp, setSp] = useState(0);
  const [kind, setKind] = useState('All');
  const [ven, setVen] = useState('all');
  const [paused, setPaused] = useState(prefersReducedMotion);
  const [files, setFiles] = useState({});
  const [rail, setRail] = useState({ l: false, r: true });
  const [wide, setWide] = useState(() => window.innerWidth >= 900);
  const railRef = useRef(null);
  const barRef = useRef(null);
  const tweenRef = useRef(null);
  const inView = useRef(false);
  const sectionRef = useRef(null);

  // visible species, grouped by kind in KINDS order
  const vis = useMemo(
    () => KINDS.slice(1).flatMap((k) => SPECIES.map((s, i) => i).filter((i) => SPECIES[i].kind === k))
      .filter((i) => matchesKind(SPECIES[i], kind) && matchesVen(SPECIES[i], ven)),
    [kind, ven, animalsVer]
  );
  const vpos = Math.max(0, vis.indexOf(sp));
  const cur = SPECIES[sp];

  const fileOf = (i) => SPECIES[i].file || files[i] || '';
  const imgOf = (i, w) => SPECIES[i].img || (fileOf(i) ? FP(fileOf(i)) + '?width=' + w : '');
  const step = (d) => setSp(vis[(vpos + d + vis.length) % vis.length]);

  // photos from Wikipedia for species without a bundled file; fetched only once the section is near the screen
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || !('IntersectionObserver' in window)) { setNear(true); return undefined; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setNear(true); io.disconnect(); } }, { rootMargin: '900px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!near) return undefined;
    let dead = false;
    SPECIES.forEach((s, i) => {
      if (!s.wiki) return;
      fetch('https://en.wikipedia.org/api/rest_v1/page/summary/' + s.wiki).then((r) => r.json()).then((j) => {
        const src = (j.originalimage && j.originalimage.source) || (j.thumbnail && j.thumbnail.source);
        if (!src || dead) return;
        const parts = src.split('?')[0].split('/');
        const f = decodeURIComponent(src.includes('/thumb/') ? parts[parts.length - 2] : parts[parts.length - 1]);
        setFiles((st) => (st[i] ? st : { ...st, [i]: s.file || f }));
      }).catch(() => {});
    });
    return () => { dead = true; };
  }, [near]);

  useEffect(() => {
    const onResize = () => setWide(window.innerWidth >= 900);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // rail edge state
  const railUpd = useCallback(() => {
    const r = railRef.current;
    if (!r) return;
    const l = r.scrollLeft > 4, rr = r.scrollLeft + r.clientWidth < r.scrollWidth - 4;
    setRail((p) => (p.l === l && p.r === rr ? p : { l, r: rr }));
  }, []);
  useEffect(() => {
    const id = setTimeout(railUpd, 300);
    window.addEventListener('resize', railUpd);
    return () => { clearTimeout(id); window.removeEventListener('resize', railUpd); };
  }, [railUpd]);

  // slideshow: a 6s progress bar that advances to the next visible species
  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return undefined;
    const next = () => setSp(vis[(Math.max(0, vis.indexOf(sp)) + 1) % vis.length]);
    const t = gsap.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: SLIDE_SECONDS, ease: 'none', onComplete: next });
    tweenRef.current = t;
    if (paused || !inView.current) t.pause();
    return () => t.kill();
  }, [sp, vis, paused]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || !('IntersectionObserver' in window)) { inView.current = true; return undefined; }
    const io = new IntersectionObserver(([e]) => {
      inView.current = e.isIntersecting;
      const t = tweenRef.current;
      if (t) (e.isIntersecting && !paused ? t.resume() : t.pause());
    }, { threshold: .25 });
    io.observe(el);
    return () => io.disconnect();
  }, [paused]);

  // keep the active tab on screen and animate the detail panel on change
  const first = useRef(true);
  useEffect(() => {
    const r = railRef.current;
    const b = r && r.querySelector(`[data-sp-tab="${sp}"]`);
    if (b) {
      const x = b.offsetLeft - r.offsetLeft;
      if (x < r.scrollLeft + 20 || x + b.offsetWidth > r.scrollLeft + r.clientWidth - 20) r.scrollTo({ left: Math.max(0, x - 40), behavior: 'smooth' });
    }
    if (first.current) { first.current = false; return; }
    if (prefersReducedMotion) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('.sp-photo', { scale: 1.08, opacity: 0 }, { scale: 1, opacity: 1, duration: .9, ease: 'expo.out' });
      gsap.fromTo('.sp-info > *', { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: .7, ease: 'expo.out', stagger: .04 });
    }, sectionRef);
    return () => ctx.revert();
  }, [sp]);

  const pickKind = (k) => {
    const firstIdx = SPECIES.findIndex((s) => matchesKind(s, k) && matchesVen(s, ven));
    setKind(k);
    if (!(k === 'All' && kind === 'All')) setSp(firstIdx);
    railRef.current?.scrollTo({ left: 0 });
    setTimeout(railUpd, 60);
  };
  const pickVen = (key) => {
    const ok = (s, k) => matchesKind(s, k) && matchesVen(s, key);
    const k = SPECIES.some((s) => ok(s, kind)) ? kind : 'All';
    setVen(key);
    setKind(k);
    if (!ok(SPECIES[sp], k)) setSp(SPECIES.findIndex((s) => ok(s, k)));
  };
  const railBy = (d) => { const r = railRef.current; if (r) r.scrollBy({ left: d * r.clientWidth * .7, behavior: 'smooth' }); };

  const sc = STATUS_C[cur.status];
  const cf = fileOf(sp);
  const photo = imgOf(sp, 1400);
  const sz = cur.sizeCm;
  const ref = sz ? (sz <= 25 ? [18, 'Adult hand', '18 cm'] : [170, 'Adult person', '1.7 m']) : null;
  const mx = sz ? Math.max(sz, ref[0]) : 1;
  const look = cur.look;
  const lookTarget = look && look.target ? SPECIES.findIndex((s) => s.name === look.target) : -1;
  const credit = cf
    ? 'https://commons.wikimedia.org/wiki/File:' + encodeURIComponent(cf.replace(/ /g, '_'))
    : 'https://commons.wikimedia.org/wiki/Category:' + cur.sci.replace(/ /g, '_');

  return (
    <section id="species" className="section section-tight-top species" data-screen-label="Species" ref={sectionRef}>
      <div className="container stack-48">
        <div className="sp-head">
          <div className="section-head">
            <span className="eyebrow">Not only snakes</span>
            <h2 className="h2 split"><Split parts={["Meet the island's", { text: 'herps.', serif: true }]} /></h2>
          </div>
          <div className="sp-head-side">
            <p>Snakes, frogs, lizards and a turtle that our members study, survey and photograph. Many are found nowhere else on Earth.</p>
            <SmartLink to="/learn" className="btn btn-primary btn-sm sp-learn">Open the Learn page <span aria-hidden="true">→</span></SmartLink>
          </div>
        </div>

        <div className="sp-controls">
          <div className="sp-filterbar">
            <div role="group" aria-label="Filter species" className="sp-chips">
              {KINDS.map((k) => {
                const n = SPECIES.filter((s) => matchesKind(s, k) && matchesVen(s, ven)).length;
                return <button type="button" key={k} className={'sp-chip' + (k === kind ? ' on' : '')} onClick={() => pickKind(k)}>{k} <span>{n}</span></button>;
              })}
            </div>
            <div role="group" aria-label="Venom filter" className="sp-ven">
              {VEN.map(([key, label, dot]) => (
                <button type="button" key={key} className={key === ven ? 'on' : ''} aria-pressed={key === ven} onClick={() => pickVen(key)}>
                  <i style={{ background: dot, boxShadow: `0 0 6px ${dot}` }} />{label}
                </button>
              ))}
            </div>
          </div>
          <div className="sp-railwrap">
            <button type="button" className="sp-arrow" aria-label="Scroll species left" style={{ opacity: rail.l ? 1 : .35 }} onClick={() => railBy(-1)}>←</button>
            <div className="sp-rail" ref={railRef} onScroll={railUpd} role="tablist" aria-label="Species"
              style={{ '--mask-l': rail.l ? 'transparent' : '#000', '--mask-r': rail.r ? 'transparent' : '#000' }}>
              {vis.map((i) => {
                const s = SPECIES[i];
                const t = imgOf(i, 120);
                return (
                  <button type="button" role="tab" key={s.name} data-sp-tab={i} aria-selected={i === sp} className={'sp-tab' + (i === sp ? ' on' : '')} onClick={() => setSp(i)}>
                    <span className="sp-thumb" style={{ borderColor: s.venom ? '#E87060' : 'rgba(168,219,90,.7)' }}>
                      <span>{t && <img src={t} alt="" loading="lazy" />}</span>
                    </span>
                    <span>{s.name}</span>
                    <span className="sp-kind">{s.kind.replace(/s$/, '')}</span>
                  </button>
                );
              })}
            </div>
            <button type="button" className="sp-arrow sp-arrow-go" aria-label="Scroll species right" style={{ opacity: rail.r ? 1 : .35 }} onClick={() => railBy(1)}>→</button>
          </div>
        </div>

        <div className="sp-grid" style={{ '--sp-h': wide ? '600px' : 'auto' }}>
          <figure className="sp-img">
            {photo && <div className="sp-photo" role="img" aria-label={cur.name + ' (' + cur.sci + ')'} style={{ backgroundImage: `url("${photo}")`, backgroundPosition: cur.pos }} />}
            <div className="sp-shade" aria-hidden="true" />
            <div className="sp-player">
              <button type="button" onClick={() => setPaused((p) => !p)} aria-label={paused ? 'Play species slideshow' : 'Pause species slideshow'} aria-pressed={paused}>
                <span aria-hidden="true">{paused ? '▶' : '❚❚'}</span>{paused ? 'Play' : 'Pause'}
              </button>
              <span className="sp-track" aria-hidden="true"><span ref={barRef} /></span>
            </div>
            <figcaption>
              <span className="sp-cap">
                <span className="sp-count">{String(vpos + 1).padStart(2, '0')} / {String(vis.length).padStart(2, '0')}</span>
                <span className="sp-sci">{cur.sci}</span>
              </span>
              {cur.img
                ? <span className="sp-credit">Photo: SLYHS · credit to be supplied</span>
                : <a className="sp-credit" href={credit} target="_blank" rel="noopener noreferrer">Photo: Wikimedia Commons · author &amp; licence ↗</a>}
            </figcaption>
          </figure>

          <article className="sp-info">
            <span className="sp-group">{cur.group}</span>
            <div className="sp-names">
              <h3>{cur.name}</h3>
              <span className="sp-latin">{cur.sci}</span>
              {cur.syn && <span className="sp-syn">{cur.syn}</span>}
            </div>
            <div className="sp-tags">
              {cur.endemic !== false && <span className="tag tag-endemic">Endemic</span>}
              {cur.endemic === false && <span className="tag">Native · also in India</span>}
              {cur.harmless && <span className="tag tag-safe">Non-venomous</span>}
              {cur.status && <span className="tag" style={{ borderColor: sc[0], color: sc[1] }}>IUCN · {cur.status}</span>}
              {cur.venom && <span className="tag tag-venom">Venomous</span>}
              {cur.local && <span className="tag tag-local">{cur.local}</span>}
            </div>
            <p className="sp-desc">{cur.desc}</p>
            <dl className="sp-facts">
              {cur.facts.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
            </dl>

            {sz && (
              <div className="sp-box">
                <span className="sp-label">Size check</span>
                <div className="sp-size">
                  <span>This species</span>
                  <span className="bar"><span style={{ width: Math.max(2, sz / mx * 100) + '%' }} /></span>
                  <span className="val">{cur.sizeLabel}</span>
                  <span className="dim">{ref[1]}</span>
                  <span className="bar"><span className="ref" style={{ width: ref[0] / mx * 100 + '%' }} /></span>
                  <span className="dim">{ref[2]}</span>
                </div>
              </div>
            )}

            {look && (
              <div className="sp-box sp-look">
                <div className="sp-boxhead">
                  <span className="sp-label">Don't confuse with</span>
                  {lookTarget >= 0 && <button type="button" className="sp-link" onClick={() => { setKind('All'); setVen('all'); setSp(lookTarget); }}>View {look.name} →</button>}
                </div>
                <div className="sp-lookgrid">
                  <strong>{cur.name}</strong><strong>{look.name}</strong>
                  {look.rows.map(([a, b]) => <Fragment key={a}><span>{a}</span><span>{b}</span></Fragment>)}
                </div>
                <span className="sp-warn">If you are not sure, treat it as venomous.</span>
              </div>
            )}

            <div className="sp-foot">
              <span>Look, photograph, record. Never handle.</span>
              <div>
                <button type="button" className="sp-arrow" aria-label="Previous species" onClick={() => step(-1)}>←</button>
                <button type="button" className="sp-arrow sp-arrow-go" aria-label="Next species" onClick={() => step(1)}>→</button>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
