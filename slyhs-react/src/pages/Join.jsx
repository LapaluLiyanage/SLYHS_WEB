import { useCallback, useEffect, useRef, useState } from 'react';
import { useLang } from '../lib/i18n';
import { useSmooth } from '../lib/smooth';
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from '../lib/gsap';
import usePageFX from '../lib/usePageFX';
import { choreograph, goPose } from '../three/choreography';
import Hero from '../components/Hero';
import Split from '../components/Split';
import SmartLink from '../components/SmartLink';
import { SlimFooter } from '../components/Footer';
import { Field, TextInput, Select, DatePicker, Chips, Check } from '../components/FormBits';
import {
  BLANK, OPTS, MULTI, DISTRICTS, STATUSES, TIERS, PERKS, DRAFT_KEY,
  derive, validate, submitRegistration, listLanguages
} from './joinData';

function loadDraft() {
  try {
    const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
    if (d && d.data) {
      const data = { ...BLANK, ...d.data };
      // older drafts stored a single language as a string
      if (!Array.isArray(data.prefLang)) data.prefLang = data.prefLang ? [data.prefLang] : [];
      return { data, step: d.step || 1, savedAt: 'restored' };
    }
  } catch (e) { /* storage unavailable */ }
  return { data: { ...BLANK }, step: 1, savedAt: null };
}

/* ====================================================================== */

function Register() {
  const { t } = useLang();
  const { scrollTo } = useSmooth();
  const [initial] = useState(loadDraft);
  const [data, setData] = useState(initial.data);
  const [step, setStep] = useState(initial.step);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('editing'); // editing | submitting | serverError | duplicate | success
  const [savedAt, setSavedAt] = useState(initial.savedAt);
  const [shareMsg, setShareMsg] = useState('');
  const cardRef = useRef(null);
  const lockUntil = useRef(0);
  const dir = useRef(1);
  const firstStep = useRef(true);

  const v = derive(data);
  const success = status === 'success';
  const submitting = status === 'submitting';

  useEffect(() => {
    if (success) return;
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ data, step })); } catch (e) { /* storage unavailable */ }
  }, [data, step, success]);

  const set = useCallback((name, val) => {
    setData((d) => ({ ...d, [name]: val }));
    setErrors((e) => { if (!e[name]) return e; const n = { ...e }; delete n[name]; return n; });
    setSavedAt('now');
    if (name === 'email') setStatus((s) => (s === 'duplicate' ? 'editing' : s));
  }, []);

  const toCard = () => scrollTo('#form-card');

  const flag = (e) => {
    setErrors(e);
    toCard();
    requestAnimationFrame(() => {
      if (!prefersReducedMotion) gsap.fromTo(cardRef.current.querySelectorAll('.has-error'), { x: 0 }, { x: 8, duration: .07, repeat: 5, yoyo: true, ease: 'sine.inOut', clearProps: 'transform' });
      const bad = cardRef.current.querySelector('.has-error input, .has-error select, .has-error textarea');
      if (bad) bad.focus({ preventScroll: true });
    });
  };

  const goTo = (n, nextErrors = {}) => {
    dir.current = n > step ? 1 : -1;
    lockUntil.current = performance.now() + 450; // stops a double-click skipping a step
    setStep(n);
    setErrors(nextErrors);
    toCard();
  };

  const next = () => {
    if (performance.now() < lockUntil.current) return;
    const e = validate(step, data);
    if (Object.keys(e).length) { flag(e); return; }
    goTo(step + 1);
  };

  const back = () => {
    if (performance.now() < lockUntil.current) return;
    setStatus('editing');
    goTo(Math.max(1, step - 1));
  };

  const submit = () => {
    if (submitting || performance.now() < lockUntil.current) return;
    const e = validate(4, data);
    if (Object.keys(e).length) { flag(e); return; }
    setErrors({});
    setStatus('submitting');
    submitRegistration({ ...data, tier: v.tier })
      .then((res) => {
        if (res && res.duplicate) { setStatus('duplicate'); return; }
        try { localStorage.removeItem(DRAFT_KEY); } catch (err) { /* storage unavailable */ }
        setStatus('success');
        toCard();
      })
      .catch(() => setStatus('serverError'));
  };

  const onFormSubmit = (e) => { e.preventDefault(); if (step < 4) next(); else submit(); };

  const share = async () => {
    const url = window.location.href.split('#')[0];
    try {
      if (navigator.share) { await navigator.share({ title: 'Join SLYHS', url }); return; }
      await navigator.clipboard.writeText(url);
      setShareMsg('Link copied.');
    } catch (e) {
      setShareMsg('Copy this page link to share.');
    }
  };

  // animate each new step panel in
  useGSAP(() => {
    if (firstStep.current) { firstStep.current = false; return; }
    if (prefersReducedMotion || success) return;
    const panel = cardRef.current.querySelector('.step-panel');
    gsap.fromTo(panel, { x: dir.current * 46, opacity: 0 }, { x: 0, opacity: 1, duration: .6, ease: 'expo.out', clearProps: 'transform,opacity' });
    gsap.fromTo(panel.querySelectorAll('.field, .check, .tier-result, .guardian, .alert-info, .step-intro'),
      { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: .55, ease: 'power3.out', stagger: .025, delay: .06, clearProps: 'transform,opacity' });
    const first = panel.querySelector('input:not([type="checkbox"]):not([type="radio"]), select, textarea');
    if (first && window.matchMedia('(pointer: fine)').matches) first.focus({ preventScroll: true });
  }, { scope: cardRef, dependencies: [step] });

  // celebrate
  useGSAP(() => {
    if (!success || prefersReducedMotion) return;
    gsap.from('.success-mark', { scale: 0, rotate: -120, duration: .9, ease: 'back.out(2.2)' });
    gsap.from('.success > *:not(.success-mark):not(.burst)', { y: 20, opacity: 0, duration: .7, ease: 'expo.out', stagger: .06, delay: .15 });
    gsap.utils.toArray('.burst').forEach((p) => {
      const a = Math.random() * Math.PI * 2;
      const r = 60 + Math.random() * 130;
      gsap.fromTo(p, { x: 0, y: 0, scale: 1, opacity: 1 }, { x: Math.cos(a) * r, y: Math.sin(a) * r, scale: 0, opacity: 0, duration: 1 + Math.random() * .6, ease: 'expo.out', delay: .1 });
    });
    goPose('coil', 1.4);
  }, { scope: cardRef, dependencies: [success] });

  const errCount = Object.keys(errors).length;
  const savedNote = savedAt === 'restored' ? 'Draft restored from this device' : savedAt ? 'Saved on this device' : 'Answers save as you go';
  const fieldProps = (name) => ({ name, value: data[name], onChange: set, error: errors[name] });

  return (
    <div className="container register">
      <aside className="reg-aside glass-card">
        <span className="eyebrow">Registration</span>
        <h2 className="reg-title">{t.formTitle}</h2>
        <p className="reg-time">About 6 minutes. No account needed.</p>
        <ol className="reg-steps">
          {t.steps.map((label, i) => {
            const n = i + 1;
            const done = n < step || success;
            const cur = n === step && !success;
            return (
              <li key={n} className={(done ? 'is-done' : '') + (cur ? ' is-current' : '')} aria-current={cur ? 'step' : undefined}>
                <span className="rs-mark">{done ? '✓' : n}</span><span>{label}</span>
              </li>
            );
          })}
        </ol>
        <div className="reg-safe">
          <strong>Your details are safe</strong>
          <p>Your details are used only for society communication. Rare-species locations are never shared. You can leave at any time.</p>
        </div>
      </aside>

      <div id="form-card" className="form-card glass-card" ref={cardRef}>
        {!success ? (
          <div className="form-flow">
            <div className="form-head">
              <span className="form-step-label">Step {step} of 4 · {t.steps[step - 1]}</span>
              <span className="form-saved">{savedNote}</span>
            </div>
            <div className="form-progress" role="progressbar" aria-valuemin={1} aria-valuemax={4} aria-valuenow={step}>
              <span style={{ width: (step / 4) * 100 + '%' }} />
            </div>

            {errCount > 0 && (
              <div className="alert alert-error" role="alert"><strong>{errCount === 1 ? '1 thing' : errCount + ' things'} to fix.</strong> Check the fields marked in red below.</div>
            )}

            <form onSubmit={onFormSubmit} noValidate>
              {step === 1 && (
                <fieldset className="step-panel" key="s1">
                  <legend>About you</legend>
                  <div className="field-grid">
                    <Field name="fullName" label="Full name *" error={errors.fullName}><TextInput {...fieldProps('fullName')} autoComplete="name" /></Field>
                    <Field name="prefName" label="Preferred name (optional, used in emails)"><TextInput {...fieldProps('prefName')} /></Field>
                    <Field name="dob" label="Date of birth *" hint="Used only to check age rules." error={errors.dob}><DatePicker {...fieldProps('dob')} /></Field>
                    <Field name="email" label="Email *" hint="We'll send your confirmation here." error={errors.email}><TextInput {...fieldProps('email')} type="email" autoComplete="email" /></Field>
                    <Field name="phone" label="Mobile / WhatsApp *" error={errors.phone}><TextInput {...fieldProps('phone')} type="tel" autoComplete="tel" /></Field>
                    <Field name="district" label="District *" error={errors.district}><Select {...fieldProps('district')} placeholder="Choose your district" options={DISTRICTS} /></Field>
                    <Field name="status" label="Status *" error={errors.status}><Select {...fieldProps('status')} placeholder="Choose one" options={STATUSES} /></Field>
                    <Field name="org" label="School / University / Organisation" hidden={!v.showOrg}><TextInput {...fieldProps('org')} /></Field>
                    <Field name="field" label="Field of study or work (optional)"><TextInput {...fieldProps('field')} /></Field>
                  </div>
                  <Chips {...fieldProps('prefLang')} multi label="Preferred language(s) *" hint="Pick all that apply" options={OPTS.prefLang} />
                  {v.isMinor && (
                    <div className="alert alert-info">
                      <strong>You'll join as an Explorer.</strong> Because you're under 18, we'll ask a parent or guardian to confirm in step 4. Explorers take part in supervised activities and never handle wildlife.
                    </div>
                  )}
                </fieldset>
              )}

              {step === 2 && (
                <fieldset className="step-panel" key="s2">
                  <legend>Your interests</legend>
                  <Chips {...fieldProps('interests')} multi label="Areas of interest *" hint="Pick at least one" options={OPTS.interests} />
                  <Chips {...fieldProps('experience')} label="Experience level *" options={OPTS.experience} />
                  <Field name="researchFields" label="Strongest research field(s) (optional, helps us match a mentor)">
                    <TextInput {...fieldProps('researchFields')} placeholder="e.g. amphibian ecology, venom biology" />
                  </Field>
                  <Chips {...fieldProps('wantMentor')} label="Do you want a mentor? *" options={OPTS.wantMentor} />
                  <Chips {...fieldProps('project')} label="Doing a research project now?" options={OPTS.project} />
                  <Field name="past" label="Past activities (optional)">
                    <textarea id="past" name="past" rows={4} placeholder="Courses, projects, field work, publications" value={data.past} onChange={(e) => set('past', e.target.value)} />
                  </Field>
                </fieldset>
              )}

              {step === 3 && (
                <fieldset className="step-panel" key="s3">
                  <legend>How you want to take part</legend>
                  <p className="step-intro">Everything on this step is optional.</p>
                  <Chips {...fieldProps('joiningAs')} label="I'm joining as" options={OPTS.joiningAs} />
                  <Chips {...fieldProps('help')} multi={MULTI.help} label="How would you like to help?" options={OPTS.help} />
                  <Chips {...fieldProps('time')} label="Time you can give" options={OPTS.time} />
                  <Chips {...fieldProps('resources')} multi label="Resources or access you can offer" options={OPTS.resources} />
                  <Field name="funding" label="Funding or contacts you could offer (mentors & partners)" hidden={!v.showFunding}>
                    <textarea id="funding" name="funding" rows={3} value={data.funding} onChange={(e) => set('funding', e.target.value)} />
                  </Field>
                  <Chips {...fieldProps('helpLangs')} multi label="Languages you can help with" options={OPTS.helpLangs} />
                </fieldset>
              )}

              {step === 4 && (
                <fieldset className="step-panel" key="s4">
                  <legend>Consent and submit</legend>
                  <div className="tier-result">
                    <span className="tr-label">You'll join as</span>
                    <span className="tr-name">{v.tier}</span>
                    <span className="tr-note">{v.tierNote}</span>
                  </div>
                  {v.isMinor && (
                    <div className="guardian">
                      <strong>Parent or guardian</strong>
                      <p>Because you're under 18, a parent or guardian must give permission.</p>
                      <div className="field-grid">
                        <Field name="gName" label="Full name *" error={errors.gName}><TextInput {...fieldProps('gName')} /></Field>
                        <Field name="gRel" label="Relationship *" error={errors.gRel}><TextInput {...fieldProps('gRel')} placeholder="e.g. Mother" /></Field>
                        <Field name="gPhone" label="Phone *" error={errors.gPhone}><TextInput {...fieldProps('gPhone')} type="tel" /></Field>
                        <Field name="gEmail" label="Email *" error={errors.gEmail}><TextInput {...fieldProps('gEmail')} type="email" /></Field>
                      </div>
                      <Check name="gConsent" checked={data.gConsent} onChange={set} error={errors.gConsent}>
                        I give permission for my child to join the Society. I understand that members under 18 take part only in supervised activities and never handle wildlife.
                      </Check>
                    </div>
                  )}
                  <span className="group-label">Required</span>
                  <Check name="ethics" checked={data.ethics} onChange={set} error={errors.ethics}>I have read and agree to the <a href="#">Code of Ethics</a>.</Check>
                  <Check name="wildlife" checked={data.wildlife} onChange={set} error={errors.wildlife}>I understand I must not handle, collect, keep or trade wildlife unless I am trained, certified and permitted.</Check>
                  <Check name="privacy" checked={data.privacy} onChange={set} error={errors.privacy}>I agree to the <a href="#">Privacy Policy</a>.</Check>
                  <span className="group-label">Optional</span>
                  <Check name="directory" checked={data.directory} onChange={set}>Include me in the member directory (name, district and interests only).</Check>
                  <Check name="newsletter" checked={data.newsletter} onChange={set}>Send me the monthly newsletter.</Check>
                  <Check name="whatsapp" checked={data.whatsapp} onChange={set}>Add me to my district's WhatsApp group.</Check>
                  <div className="field-captcha">
                    <Field name="captcha" label="Quick check: what is 3 + 4? *" hint="Helps us block spam. No tracking." error={errors.captcha}>
                      <TextInput {...fieldProps('captcha')} inputMode="numeric" />
                    </Field>
                  </div>
                </fieldset>
              )}

              {status === 'serverError' && (
                <div className="alert alert-error" role="alert">
                  <strong>We couldn't send your registration.</strong> Your answers are saved on this device. Check your connection and try again.
                  <button type="button" className="btn btn-outline btn-inline" onClick={submit}>Retry</button>
                </div>
              )}
              {status === 'duplicate' && (
                <div className="alert alert-error" role="alert">
                  <strong>{data.email} is already registered.</strong> If that's you, you're already a member. Check your inbox for the welcome email.
                  <span className="alert-actions">
                    <button type="button" className="btn btn-outline btn-inline" onClick={() => { setStatus('editing'); goTo(1, { email: 'Use a different email, or contact us if this one is yours.' }); }}>Use a different email</button>
                    <a href="#">Contact the committee</a>
                  </span>
                </div>
              )}

              <div className="form-nav">
                {step > 1 && !submitting && <button type="button" className="btn btn-outline btn-nav" onClick={back}>← {t.back}</button>}
                {step < 4 && <button type="button" className="btn btn-primary btn-nav" onClick={next}>{t.next} →</button>}
                {step === 4 && (
                  <button type="submit" className="btn btn-primary btn-nav" id="submitBtn" disabled={submitting} aria-busy={submitting}>
                    <span className="spinner" aria-hidden="true" />{submitting ? t.submitting : t.submit}
                  </button>
                )}
              </div>
            </form>
          </div>
        ) : (
          <div className="success" role="status">
            <span className="success-mark" aria-hidden="true">✓</span>
            {Array.from({ length: 22 }, (_, i) => <span className="burst" key={i} aria-hidden="true" />)}
            <h3>Welcome to the Society!</h3>
            <p>We've sent a confirmation email to <strong>{data.email}</strong> in {listLanguages(data.prefLang)}.</p>
            <div className="tier-result">
              <span className="tr-label">Your tier</span>
              <span className="tr-name">{v.tier}</span>
              <span className="tr-note">{v.tierNote}</span>
            </div>
            <strong className="next-title">Next steps</strong>
            <ol className="next-steps">
              <li><span>01</span><a href="#">Join your district WhatsApp group</a></li>
              <li><span>02</span><SmartLink to="/#events">Attend the first online meeting</SmartLink></li>
              <li><span>03</span><a href="#">Read the Code of Ethics</a></li>
            </ol>
            <button type="button" className="btn btn-ghost glass" onClick={share}>Share with a friend</button>
            {shareMsg && <span className="share-msg" role="status">{shareMsg}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

/* ====================================================================== */

export default function Join() {
  const { t, lang } = useLang();
  const scope = useRef(null);
  usePageFX(scope);

  const words = t.title.split(' ');
  const accent = words.pop();

  useGSAP(() => {
    choreograph([
      { trigger: '#top', pose: 'hidden', start: 'top top', end: 'bottom 55%', duration: .8 },
      { trigger: '#tiers', pose: 'slither', duration: 2.4 },
      { trigger: '#register', pose: 'faint', start: 'top 60%', end: 'bottom 30%' },
      { trigger: '.site-footer', pose: 'hidden', start: 'top 95%', end: 'bottom bottom', duration: 1 }
    ]);
    if (prefersReducedMotion) return () => goPose('hidden', .4);

    gsap.timeline({ defaults: { ease: 'expo.out', duration: 1.2 }, delay: .1 })
      .from('.hero-media', { scale: 1.18, duration: 2.6, ease: 'power3.out' }, 0)
      .from('.badge', { y: 22, opacity: 0 }, .3)
      .from('.hero-title .wi', { yPercent: 120, rotationX: -80, transformOrigin: '50% 100%', transformPerspective: 700, stagger: .08, duration: 1.5 }, .4)
      .from('.hero-sub', { y: 26, opacity: 0 }, .85)
      .from('.checks li', { y: 14, opacity: 0, stagger: .06 }, .95)
      .from('.hero-ctas > *', { y: 26, opacity: 0, stagger: .09 }, 1.05);
    gsap.to('.hero-inner', { y: -110, opacity: .05, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: '+=600', scrub: true } });

    const mobile = window.matchMedia('(max-width: 760px)').matches;
    if (mobile) {
      // phones: tiers are a swipeable row; they fan in from the right, then a hint nudges the row once
      gsap.from('.tier', { x: 90, opacity: 0, scale: .94, duration: 1.1, ease: 'expo.out', stagger: .09, scrollTrigger: { trigger: '.tiers', start: 'top 88%' } });
      gsap.from('.reg-aside', { y: 50, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.reg-aside', start: 'top 90%' } });
      gsap.from('.form-card', { y: 70, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: '.form-card', start: 'top 92%' } });
      const row = document.querySelector('.tiers');
      if (row) {
        ScrollTrigger.create({
          trigger: row, start: 'top 70%', once: true,
          onEnter: () => {
            const nudge = { x: 0 };
            gsap.to(nudge, { x: 46, duration: .6, delay: 1.2, ease: 'power2.out', yoyo: true, repeat: 1, onUpdate: () => { row.scrollLeft = nudge.x; } });
          }
        });
      }
    } else {
      // tiers climb into place one rung at a time
      gsap.from('.tier', {
        y: 160, rotationX: 35, transformPerspective: 1000, transformOrigin: '50% 100%', opacity: 0,
        duration: 1.4, ease: 'expo.out', stagger: .12,
        scrollTrigger: { trigger: '.tiers', start: 'top 85%' }
      });
      gsap.from('.reg-aside', { x: -50, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.register', start: 'top 82%' } });
      gsap.from('.form-card', { y: 80, rotationX: 12, transformPerspective: 1200, opacity: 0, duration: 1.2, ease: 'expo.out', delay: .1, scrollTrigger: { trigger: '.register', start: 'top 82%' } });
    }

    return () => { goPose('hidden', .4); };
  }, { scope });

  return (
    <main ref={scope} className="page-join">
      <Hero className="hero-join" label="Join intro">
        <div className="hero-inner">
          <span className="badge glass"><span className="badge-dot" /><span>{t.noFee}</span></span>
          <h1 className="hero-title" key={lang}><Split parts={[words.join(' '), { text: accent, serif: true, grad: true }]} /></h1>
          <p className="hero-sub">{t.intro}</p>
          <ul className="checks perks">
            {PERKS.map((p) => <li key={p}><span className="tick" aria-hidden="true">✓</span>{p}</li>)}
          </ul>
          <div className="hero-ctas">
            <SmartLink to="#register" className="btn btn-primary btn-lg magnetic"><span>{t.startReg}</span> <span aria-hidden="true">↓</span></SmartLink>
            <SmartLink to="#tiers" className="btn btn-ghost btn-lg glass magnetic">Membership tiers</SmartLink>
          </div>
        </div>
      </Hero>

      <section id="tiers" className="section" data-screen-label="Membership tiers">
        <div className="container stack-56">
          <div className="section-head center">
            <span className="eyebrow">Membership tiers</span>
            <h2 className="h2 split"><Split parts={['Everyone starts somewhere. Levels are', { text: 'earned, not bought.', serif: true }]} /></h2>
          </div>
          <ol className="tiers">
            {TIERS.map((tr, i) => (
              <li key={tr.name} className={'tier glass-card' + (i === 4 ? ' is-top' : '')} style={{ '--lvl': i }} data-tilt>
                <div className="tier-top"><span className="tier-n">{tr.n}</span><span className={'tier-tag tag-' + tr.kind}>{tr.tag}</span></div>
                <h3>{tr.name}</h3>
                <dl><dt>Who</dt><dd>{tr.who}</dd><dt>Can</dt><dd>{tr.can}</dd></dl>
              </li>
            ))}
          </ol>
          <p className="tiers-note glass" data-reveal>
            Everyone starts as an Explorer or Member. Rescuer and Specialist levels are earned through training and mentor approval. <strong>Members under 18 never handle wildlife.</strong>
          </p>
        </div>
      </section>

      <section id="register" className="section section-tight-top" data-screen-label="Registration form">
        <Register />
      </section>

      <SlimFooter />
    </main>
  );
}
