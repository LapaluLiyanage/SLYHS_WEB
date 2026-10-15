import { useCallback, useEffect, useRef, useState } from 'react';
import { useLang } from '../lib/i18n';
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from '../lib/gsap';
import usePageFX from '../lib/usePageFX';
import { choreograph, goPose } from '../three/choreography';
import { serpentState } from '../three/serpentState';
import Hero from '../components/Hero';
import Split from '../components/Split';
import SmartLink from '../components/SmartLink';
import { useEvents, useNow, timeLeft, sectionLink, eventsNote } from './events';
import Species from '../components/Species';
import AidModal from '../components/AidModal';
import { useSmooth } from '../lib/smooth';
import { Footer } from '../components/Footer';

const DISTRICTS = ['Colombo', 'Kandy', 'Jaffna', 'Batticaloa'];
const BARS = ['Curious', 'Contributor', 'Researcher', 'Author', 'Pro'].map((label, i) => ({
  label, h: 24 + i * 18 + '%', top: i === 4 ? 'rgba(232,245,154,.55)' : `rgba(201,238,110,${(.12 + i * .07).toFixed(2)})`, isTop: i === 4
}));
const PARTNERS = ['Partner', 'University', 'Mentor network', 'Partner', 'Partner'];
const STATS = [
  { num: 116, text: 'recognised amphibian species live in Sri Lanka. About 90% are found nowhere else on Earth.', source: 'AmphibiaWeb', url: 'https://amphibiaweb.org' },
  { num: 72, text: 'of those amphibian species are threatened with extinction.', source: 'IUCN Red List', url: 'https://www.iucnredlist.org' },
  { num: 100, suffix: '+', text: 'snake species share the island, but only about five can cause a fatal bite.', source: 'Reptile Database', url: 'https://reptile-database.reptarium.cz' }
];
const PATH = [
  { name: 'Curious', text: 'Attend talks, workshops and supervised field walks.' },
  { name: 'Contributor', text: 'Log photo records, join surveys and help with data.' },
  { name: 'Researcher', text: 'Run your own project with a mentor beside you.' },
  { name: 'Author', text: 'Publish a note, paper or newsletter feature.' },
  { name: 'Professional', text: 'Lead surveys, teach and mentor the next cohort.' }
];
const PINGS = [
  { left: 'calc(50% - 104px)', top: '44%' }, { left: 'calc(50% + 66px)', top: '12%' },
  { left: 'calc(50% + 74px)', bottom: '14%' }, { left: 'calc(50% - 70px)', bottom: '8%' }
];

function Countdown({ date, now, label }) {
  const l = timeLeft(date, now);
  if (!l) return <span className="event-count is-live">Starting now</span>;
  return (
    <div className="event-count" role="timer" aria-label={label}>
      {[['d', l.d], ['h', l.h], ['m', l.m], ['s', l.s]].map(([k, v]) => <span key={k}><b>{String(v).padStart(2, '0')}</b>{k}</span>)}
    </div>
  );
}

export default function Home() {
  const { t, lang } = useLang();
  const scope = useRef(null);
  const firstLang = useRef(true);
  usePageFX(scope);
  const { scrollTo } = useSmooth();
  const [aidOpen, setAidOpen] = useState(false);
  const events = useEvents();
  const now = useNow(1000);
  const nextEvent = events.find((e) => e.status === 'scheduled');
  // the notice above the headline: the next dated event, else the first meeting / first listed event (all from the database, fetched once)
  const spot = nextEvent || events.find((e) => e.featured) || events[0];
  const spotTitle = !spot ? t.firstMeeting : spot.id === 'first-meeting' ? t.firstMeeting : spot.title.split(':')[0];
  const left = nextEvent && timeLeft(nextEvent.date, now);
  const evLink = sectionLink(events, lang);
  const closeAid = useCallback(() => setAidOpen(false), []);
  const identify = useCallback(() => { setAidOpen(false); setTimeout(() => scrollTo('#species'), 60); }, [scrollTo]);

  /* ---------------- page motion ---------------- */
  useGSAP(() => {
    // serpent poses per section. Created last (see bottom): triggers below a pinned
    // section must be created after the pin so their positions include its spacer.
    const serpentSteps = () => choreograph([
      { trigger: '#top', pose: 'hidden', start: 'top top', end: 'bottom 55%', duration: .8 },
      { trigger: '#why', pose: 'assemble', duration: 2.4 },
      { trigger: '#path', pose: 'coil', start: 'top 60%', end: 'bottom 40%' },
      { trigger: '#events', pose: 'slither' },
      { trigger: '#join', pose: 'scatter', start: 'top 75%', end: 'bottom 25%' },
      { trigger: '.site-footer', pose: 'hidden', start: 'top 85%', end: 'bottom bottom', duration: 1 }
    ]);

    if (prefersReducedMotion) {
      serpentSteps();
      gsap.utils.toArray('.path .step-n').forEach((n) => n.classList.add('is-lit'));
      gsap.set('.path-line span', { scaleX: 1 });
      return () => goPose('hidden', .4);
    }

    // phones: each card animates as it reaches the screen (a shared trigger would fire
    // while later cards are still far below), sliding in from alternating sides, no 3D tilt
    const mobile = window.matchMedia('(max-width: 760px)').matches;
    const rise = (sel, trigger, start, desk) => {
      if (mobile) {
        gsap.utils.toArray(sel).forEach((el, i) => {
          gsap.from(el, { x: i % 2 ? 38 : -38, y: 54, scale: .96, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%' } });
        });
      } else {
        gsap.from(sel, { ...desk, scrollTrigger: { trigger, start } });
      }
    };

    /* intro */
    gsap.timeline({ defaults: { ease: 'expo.out', duration: 1.2 }, delay: .1 })
      .from('.hero-media', { scale: 1.18, duration: 2.6, ease: 'power3.out' }, 0)
      .from(document.getElementById('siteHeader'), { y: -40, opacity: 0, duration: 1 }, .2) // header lives outside this scope
      .from('.badge', { y: 22, opacity: 0 }, .35)
      .from('.hero-title .wi', { yPercent: 120, rotationX: -80, transformOrigin: '50% 100%', transformPerspective: 700, stagger: .06, duration: 1.5 }, .45)
      .from('.hero-sub', { y: 26, opacity: 0 }, .95)
      .from('.hero-ctas > *', { y: 26, opacity: 0, stagger: .09 }, 1.05)
      .from('.checks li', { y: 14, opacity: 0, stagger: .07 }, 1.15);

    gsap.to('.hero-inner', { y: -110, opacity: .05, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: '+=650', scrub: true } });

    /* pillars: rise out of depth */
    rise('.pillar', '.pillars', 'top 88%', { y: 120, rotationX: 28, transformOrigin: '50% 100%', transformPerspective: 1100, opacity: 0, duration: 1.4, ease: 'expo.out', stagger: .12 });
    const viz = (trigger) => gsap.timeline({ scrollTrigger: { trigger, start: 'top 72%' } });
    viz('.viz-connect')
      .from('.district .chip', { x: -16, opacity: 0, stagger: .08, duration: .7, ease: 'power3.out' })
      .from('.district .dots', { scaleX: 0, stagger: .08, duration: .9, ease: 'power2.inOut' }, '-=.5')
      .from('.hub', { scale: .4, opacity: 0, duration: 1, ease: 'elastic.out(1, .55)' }, '-=.4');
    gsap.to('.hub', { boxShadow: '0 0 64px rgba(201,238,110,.6)', repeat: -1, yoyo: true, duration: 1.8, ease: 'sine.inOut' });
    viz('.viz-bars')
      .from('.bar', { scaleY: 0, stagger: .1, duration: 1.1, ease: 'expo.out' })
      .from('.bar-col span', { opacity: 0, y: 6, stagger: .06, duration: .5 }, '-=.9')
      .from('.your-path', { y: 12, opacity: 0, duration: .7, ease: 'back.out(2)' }, '-=.3');
    viz('.viz-radar')
      .from('.ring', { scale: 0, opacity: 0, stagger: .12, duration: 1.1, ease: 'expo.out' })
      .from('.core', { scale: 0, rotate: -90, duration: 1, ease: 'back.out(2)' }, '-=.8')
      .from('.ping', { scale: 0, stagger: .1, duration: .5, ease: 'back.out(3)' }, '-=.5')
      .add(() => { gsap.to('.ping', { scale: 1.7, opacity: .45, duration: 1.1, ease: 'sine.inOut', stagger: { each: .35, repeat: -1, yoyo: true } }); });

    /* partners marquee, nudged by scroll velocity */
    const marquee = gsap.to('.marquee-track', { xPercent: -50, duration: 28, ease: 'none', repeat: -1 });
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate(self) {
        marquee.timeScale(gsap.utils.clamp(-4, 4, 1 + self.getVelocity() / 600) || 1);
        gsap.to(marquee, { timeScale: 1, duration: 1.2, ease: 'power2.out', overwrite: true });
      }
    });
    gsap.from('.partners', { opacity: 0, y: 30, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.partners', start: 'top 92%' } });

    /* stats */
    rise('.stat', '.stats', 'top 84%', { y: 90, rotationY: -18, transformPerspective: 1000, opacity: 0, duration: 1.3, ease: 'expo.out', stagger: .12 });
    gsap.utils.toArray('.stat-num').forEach((el) => {
      const end = Number(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const obj = { v: 0 };
      el.textContent = '0' + suffix;
      gsap.to(obj, { v: end, duration: 2.2, ease: 'power3.out', onUpdate: () => { el.textContent = Math.round(obj.v) + suffix; }, scrollTrigger: { trigger: el, start: 'top 86%' } });
    });

    /* path: pinned + scrubbed on desktop, simple reveal on small screens */
    const stepNums = gsap.utils.toArray('.path .step-n');
    const light = (p) => stepNums.forEach((n, i) => n.classList.toggle('is-lit', p >= i / (stepNums.length - 1) - .02));
    const mm = gsap.matchMedia();
    mm.add('(min-width: 1080px)', () => {
      const tl = gsap.timeline({
        defaults: { ease: 'power2.out' },
        scrollTrigger: {
          trigger: '#path', start: 'top top+=40', end: '+=160%', pin: true, scrub: .8, anticipatePin: 1,
          onUpdate: (self) => light(self.progress * 1.15)
        }
      });
      tl.from('.step', { y: 160, rotationX: -45, transformPerspective: 900, transformOrigin: '50% 100%', opacity: 0, stagger: .35, duration: 1 }, 0)
        .to('.path-line span', { scaleX: 1, ease: 'none', duration: 2.2 }, .2)
        .fromTo(serpentState, { spin: 0 }, { spin: Math.PI * 1.5, ease: 'none', duration: 2.6 }, 0);
    });
    mm.add('(min-width: 761px) and (max-width: 1079px)', () => {
      gsap.from('.step', { y: 60, opacity: 0, duration: 1, ease: 'expo.out', stagger: .1, scrollTrigger: { trigger: '.path', start: 'top 85%' } });
      gsap.to('.path-line span', { scaleX: 1, scrollTrigger: { trigger: '.path-wrap', start: 'top 75%', end: 'bottom 45%', scrub: .6, onUpdate: (self) => light(self.progress) } });
    });
    // phones: a vertical timeline that draws itself down the page; each number lights up
    // and pops as its card reaches the middle of the screen
    mm.add('(max-width: 760px)', () => {
      gsap.fromTo('.path-line span', { scaleY: 0 }, {
        scaleY: 1, ease: 'none',
        scrollTrigger: { trigger: '.path-wrap', start: 'top 70%', end: 'bottom 62%', scrub: .5 }
      });
      gsap.utils.toArray('.step').forEach((card) => {
        const num = card.querySelector('.step-n');
        gsap.from(card, { x: 44, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: card, start: 'top 90%' } });
        ScrollTrigger.create({
          trigger: card, start: 'top 62%',
          onEnter: () => { num.classList.add('is-lit'); gsap.fromTo(num, { scale: .55 }, { scale: 1, duration: .7, ease: 'back.out(3)' }); },
          onLeaveBack: () => num.classList.remove('is-lit')
        });
      });
    });

    /* events */
    rise('.event', '.events', 'top 84%', { y: 90, rotationX: 20, transformPerspective: 1000, transformOrigin: '50% 100%', opacity: 0, duration: 1.2, ease: 'expo.out', stagger: .12 });

    /* join band */
    gsap.fromTo('.join-band', { clipPath: 'inset(12% 9% 12% 9% round 56px)' }, {
      clipPath: 'inset(0% 0% 0% 0% round 32px)', ease: 'none',
      scrollTrigger: { trigger: '.join-band', start: 'top 95%', end: 'top 35%', scrub: true }
    });
    gsap.fromTo('.join-media', { yPercent: -10, scale: 1.1 }, { yPercent: 10, scale: 1, ease: 'none', scrollTrigger: { trigger: '.join-band', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.from('.join-band .btn', { y: 24, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.join-band', start: 'top 60%' } });

    serpentSteps();
    // reveals from usePageFX were created before the pin; re-order so every trigger
    // below the pinned section is measured after its spacer
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
    return () => { goPose('hidden', .4); };
  }, { scope });

  // re-animate the headline when the language changes
  useGSAP(() => {
    if (firstLang.current) { firstLang.current = false; return; }
    if (!prefersReducedMotion) gsap.from('.hero-title .wi', { yPercent: 120, rotationX: -80, transformOrigin: '50% 100%', transformPerspective: 700, duration: 1, ease: 'expo.out', stagger: .05 });
  }, { scope, dependencies: [lang] });

  return (
    <main ref={scope}>
      <Hero label="Hero">
        <span className="sr-only">Sri Lankan green pit viper resting in a loose coil</span>
        <div className="hero-inner">
          <SmartLink to="#events" className="notice glass">
            <span className="notice-org"><span className="badge-dot" />{t.society}</span>
            <span className="notice-body">
              <span className="notice-text">
                <span className="notice-title"><span className="badge-new">{t.badgeNew}</span>{spotTitle}</span>
                <span className="notice-when">{spot ? (spot.status === 'tbd' ? t.soon : `${spot.month} · ${spot.time}`) : t.badge}</span>
              </span>
              {left
                ? (
                  <span className="notice-count" role="timer" aria-label={t.startsIn}>
                    {[['d', left.d], ['h', left.h], ['m', left.m], ['s', left.s]].map(([k, v]) => <span key={k}><b>{String(v).padStart(2, '0')}</b>{k}</span>)}
                  </span>
                )
                : <span className="notice-cta">{t.noticeCta} <span aria-hidden="true">›</span></span>}
            </span>
          </SmartLink>
          <h1 className="hero-title" key={lang}>
            <Split parts={[t.h1a, { text: t.h1b, serif: true, grad: true }]} />
          </h1>
          <p className="hero-sub">{t.sub}</p>
          <div className="hero-ctas">
            <SmartLink to="/join" className="btn btn-primary btn-lg magnetic"><span>{t.join}</span> <span aria-hidden="true">→</span></SmartLink>
            <SmartLink to="#what" className="btn btn-ghost btn-lg glass magnetic">{t.learnMore}</SmartLink>
          </div>
          <ul className="checks">
            {t.checks.map((c) => <li key={c}><span className="tick" aria-hidden="true">✓</span>{c}</li>)}
          </ul>
        </div>

        <div id="what" className="pillars">
          <article className="pillar glass-card" data-tilt>
            <div className="pillar-head"><span className="pillar-num">01</span><h3>{t.pillars[0][0]}</h3></div>
            <p>{t.pillars[0][1]}</p>
            <div className="viz-connect">
              <div className="districts">
                {DISTRICTS.map((d) => <div className="district" key={d}><span className="chip">{d}</span><span className="dots" /></div>)}
              </div>
              <span className="hub">SL</span>
            </div>
          </article>
          <article className="pillar glass-card" data-tilt>
            <div className="pillar-head"><span className="pillar-num">02</span><h3>{t.pillars[1][0]}</h3></div>
            <p>{t.pillars[1][1]}</p>
            <div className="viz-bars">
              {BARS.map((b) => (
                <div className="bar-col" key={b.label}>
                  <div className={'bar' + (b.isTop ? ' bar-top' : '')} style={{ '--h': b.h, '--top': b.top }} />
                  <span>{b.label}</span>
                </div>
              ))}
              <span className="your-path glass">{t.yourPath}</span>
            </div>
          </article>
          <article className="pillar glass-card" data-tilt>
            <div className="pillar-head"><span className="pillar-num">03</span><h3>{t.pillars[2][0]}</h3></div>
            <p>{t.pillars[2][1]}</p>
            <div className="viz-radar">
              <span className="ring r1" /><span className="ring r2" /><span className="ring r3" />
              <span className="sweep" /><span className="core" />
              {PINGS.map((p, i) => <span className="ping" key={i} style={p} />)}
            </div>
          </article>
        </div>

        <div className="partners">
          <span className="eyebrow muted">{t.partnersTitle}</span>
          <div className="marquee" aria-label="Partner names (placeholders)">
            <div className="marquee-track">
              {[...PARTNERS, ...PARTNERS].map((p, i) => <span key={i} aria-hidden={i >= PARTNERS.length || undefined}>{p}</span>)}
            </div>
          </div>
        </div>
      </Hero>

      <div className="safety-wrap">
        <div role="note" className="safety glass" data-reveal>
          <strong>{t.safetyLabel}</strong>
          <span>{t.safetyText}</span>
          <button type="button" className="safety-aid" onClick={() => setAidOpen(true)}>{t.aidBtn}</button>
        </div>
      </div>

      <section id="why" className="section" data-screen-label="Why it matters">
        <div className="container stack-56">
          <div className="section-head center">
            <span className="eyebrow">{t.whyTitle}</span>
            <h2 className="h2 split"><Split key={lang} parts={[t.whyH[0], { text: t.whyH[1], serif: true }]} /></h2>
          </div>
          <div className="stats">
            {STATS.map((s, i) => (
              <div className="stat glass-card" key={s.source}>
                <span className="stat-num" data-count={s.num} data-suffix={s.suffix || ''}>{s.num}{s.suffix}</span>
                <p>{t.statsText[i]}</p>
                <a href={s.url} target="_blank" rel="noopener noreferrer">{t.source}: {s.source} ↗</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Species />

      <section id="path" className="section section-tight-top section-path" data-screen-label="Your path">
        <div className="container stack-48">
          <div className="section-head center">
            <span className="eyebrow">{t.pathTitle}</span>
            <h2 className="h2 split"><Split key={lang} parts={[t.pathH[0], { text: t.pathH[1], serif: true }]} /></h2>
          </div>
          <div className="path-wrap">
            <div className="path-line" aria-hidden="true"><span /></div>
            <ol className="path">
              {PATH.map((s, i) => (
                <li className="step glass-card" key={s.name}>
                  <span className={'step-n' + (i === 4 ? ' is-final' : '')}>{i + 1}</span>
                  <h3>{t.steps5[i][0]}</h3>
                  <p>{t.steps5[i][1]}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section id="events" className="section section-tight-top" data-screen-label="Events">
        <div className="container stack-40">
          <div className="events-head">
            <div className="section-head">
              <span className="eyebrow">{t.eventsTitle}</span>
              <h2 className="h2 h2-sm split"><Split key={lang} parts={[t.eventsH[0], { text: t.eventsH[1], serif: true }]} /></h2>
            </div>
            {evLink.external
              ? <a href={evLink.to} className="link-arrow" target="_blank" rel="noopener noreferrer">{evLink.label}</a>
              : <SmartLink to={evLink.to} className="link-arrow">{evLink.label}</SmartLink>}
          </div>
          <div className="events">
            {events.map((e) => (
              <article className={'event glass-card' + (e.featured ? ' is-featured' : '')} key={e.title}>
                <div className="event-top"><span className="event-month">{e.month}</span><span className="tag">{e.tag}</span></div>
                {e.status === 'scheduled' && <Countdown date={e.date} now={now} label={t.startsIn} />}
                <h3>{e.title}</h3>
                <dl>
                  <dt>{t.evTime}</dt><dd>{e.time}</dd>
                  <dt>{t.evWhere}</dt><dd>{e.where}</dd>
                  <dt>{t.evLang}</dt><dd>{e.lang}</dd>
                </dl>
                {e.external
                  ? <a href={e.to} className="btn btn-outline" target="_blank" rel="noopener noreferrer">{e.cta}</a>
                  : <SmartLink to={e.to} className="btn btn-outline">{e.cta}</SmartLink>}
              </article>
            ))}
          </div>
          <p className="events-note">{eventsNote(events, lang)}</p>
        </div>
      </section>

      <section id="join" className="section section-tight-top" data-screen-label="Join band">
        <div className="join-band">
          <div className="join-media" aria-hidden="true"><img src="/assets/hero-snake.jpg" alt="" /></div>
          <div className="join-scrim" aria-hidden="true" />
          <span className="join-kicker">{t.noFee}</span>
          <h2 className="h2 split"><Split key={lang} parts={[t.joinBandH[0], { text: t.joinBandH[1], serif: true }]} /></h2>
          <SmartLink to="/join#register" className="btn btn-primary btn-lg magnetic"><span>{t.startReg}</span> <span aria-hidden="true">→</span></SmartLink>
        </div>
      </section>

      <Footer />
      <AidModal open={aidOpen} onClose={closeAid} onIdentify={identify} />
    </main>
  );
}
